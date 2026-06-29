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
    // Unknown subdomain — redirect to root
    window.location.href = 'https://enga.in';
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

  const tenant = await resolveTenant();
  if (!tenant) return false;

  if (profile.role === 'super_admin') return true; // super admin can visit any subdomain

  if (profile.tenant_id !== tenant.id) {
    window.location.href = 'https://enga.in/login.html';
    return false;
  }
  return true;
}
