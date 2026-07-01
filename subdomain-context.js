// Subdomain detection and tenant context resolution
// Load this in <head> before app.js on every page

(function () {
  const host = window.location.hostname;

  function detect() {
    // Local dev: ?tenant=subdomain overrides
    const params = new URLSearchParams(window.location.search);
    const devTenant = params.get('tenant');

    if (host === 'enga.in' || host === 'www.enga.in') {
      return { type: 'root', subdomain: null };
    }

    if (host === 'super-admin.enga.in') {
      return { type: 'super-admin', subdomain: null };
    }

    // villagename.enga.in
    const match = host.match(/^([a-z0-9-]+)\.enga\.in$/);
    if (match) {
      return { type: 'tenant', subdomain: match[1] };
    }

    // GitHub Pages / localhost dev fallback
    if (devTenant) {
      return { type: 'tenant', subdomain: devTenant };
    }

    // enga018.github.io/enga.in or localhost → treat as root
    return { type: 'root', subdomain: null };
  }

  window.tenantContext = detect();
  window.tenantContext.tenant = null; // populated after DB lookup via resolveTenant()
})();

// Call once after Supabase is ready — resolves subdomain → tenant row
async function resolveTenant() {
  const ctx = window.tenantContext;
  if (ctx.type !== 'tenant' || !ctx.subdomain) return null;
  if (ctx.tenant) return ctx.tenant; // cached

  const { data } = await window.supabaseClient
    .from('tenants')
    .select('*')
    .eq('subdomain', ctx.subdomain)
    .maybeSingle();

  if (!data) {
    // No tenant row visible for this subdomain — either it doesn't exist,
    // or RLS is hiding it because this user has no/mismatched tenant_id.
    // Don't redirect cross-domain here: callers decide how to handle "no
    // tenant" on the current page (redirecting to enga.in bounces back and
    // forth with login.html/dashboard.html since the user stays logged in).
    return null;
  }

  ctx.tenant = data;
  ctx.tenantId = data.id;
  return data;
}

// Guard: call on every tenant-subdomain page after auth check
// Redirects out if logged-in user doesn't belong to this tenant
async function assertTenantMatch(profile) {
  const ctx = window.tenantContext;
  if (ctx.type !== 'tenant') return true; // root/super-admin pages skip check

  // Super admin is allowed on ANY subdomain — decide this before resolving
  // the tenant so a transient/failed tenant lookup can never lock them out.
  if (profile.role === 'super_admin') return true;

  const tenant = await resolveTenant();
  if (!tenant) return false;

  if (profile.tenant_id !== tenant.id) {
    // Redirect to login on the SAME subdomain, not root, to avoid cross-domain reload loops
    const currentHost = window.location.hostname;
    const loginUrl = currentHost.endsWith('enga.in') && currentHost !== 'enga.in' && currentHost !== 'www.enga.in'
      ? '/login.html?from=dashboard'
      : 'https://enga.in/login.html?from=dashboard';
    window.location.href = loginUrl;
    return false;
  }
  return true;
}
