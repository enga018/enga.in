// Supabase initialization

const SUPABASE_URL = "https://ebfasxnaabcutcrpwpxp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmFzeG5hYWJjdXRjcnB3cHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MDMyODgsImV4cCI6MjA5ODI3OTI4OH0.vDAQi82STczY4TOamLVvnco8mzN5Mf07h6jncGSRLRs";

let supabaseClient = null;

const AUTH_COOKIE_NAME = 'sb:auth.token';
const AUTH_COOKIE_DOMAIN = window.location.hostname.endsWith('enga.in') ? '.enga.in' : undefined;

function getCookie(name) {
  const match = document.cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(name + '='));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

function setCookie(name, value) {
  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
  const domainPart = AUTH_COOKIE_DOMAIN ? `; Domain=${AUTH_COOKIE_DOMAIN}` : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=31536000${domainPart}${secureFlag}`;
  // Also set WITHOUT explicit domain so the current host always has it
  // (browsers treat host-only and domain cookies as separate entries)
  if (AUTH_COOKIE_DOMAIN) {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=31536000${secureFlag}`;
  }
}

function deleteCookie(name) {
  const domainPart = AUTH_COOKIE_DOMAIN ? `; Domain=${AUTH_COOKIE_DOMAIN}` : '';
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domainPart}; SameSite=Lax`;
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

const cookieStorage = {
  getItem(key) {
    return getCookie(key);
  },
  setItem(key, value) {
    setCookie(key, value);
    return true;
  },
  removeItem(key) {
    deleteCookie(key);
    return true;
  },
};

function initSupabase() {
  try {
    if (!window.supabase) {
      console.error("Supabase CDN not loaded");
      return;
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: cookieStorage,
        storageKey: AUTH_COOKIE_NAME,
      },
    });
    window.supabaseClient = supabaseClient;
    console.log("Supabase initialized with cross-subdomain auth storage");
  } catch (err) {
    console.error("Supabase init failed:", err);
  }
}

window.addEventListener("load", initSupabase);

window.addEventListener("error", (e) => {
  console.error("JS ERROR:", e.message);
});

// Establishes the session on this origin from a URL fragment left by a
// session-handoff link (e.g. super admin "Visit →"), instead of relying on
// the cross-subdomain auth cookie having propagated by page load. Returns
// true if a session was set from the fragment.
async function consumeSessionHandoff() {
  if (!window.location.hash.includes('access_token')) return false;
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const access_token = hashParams.get('access_token');
  const refresh_token = hashParams.get('refresh_token');
  history.replaceState(null, '', window.location.pathname + window.location.search);
  if (!access_token || !refresh_token) return false;
  try {
    const { error } = await supabaseClient.auth.setSession({ access_token, refresh_token });
    return !error;
  } catch (err) {
    console.error('consumeSessionHandoff failed:', err);
    return false;
  }
}

async function getUser() {
  if (!supabaseClient?.auth?.getSession) return null;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.user ?? null;
  } catch (err) {
    console.error('getUser failed:', err);
    return null;
  }
}

async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.href = "login.html?from=dashboard";
    return null;
  }
  return user;
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

// Returns profile + tenant data for the current user
async function getProfile() {
  const user = await getUser();
  if (!user) return null;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;

  let tenant = null;
  if (profile.tenant_id) {
    const { data: t } = await supabaseClient
      .from("tenants")
      .select("*")
      .eq("id", profile.tenant_id)
      .single();
    tenant = t;
  }

  return { user, profile, tenant };
}

// Format property code: prefix + zero-padded number
function formatPropertyCode(number, prefix, digitLength) {
  const padded = String(number).padStart(digitLength || 4, "0");
  return `${prefix}-${padded}`;
}

// Check if a property code already exists
async function checkPropertyCodeExists(code) {
  const { data, error } = await supabaseClient
    .from("properties")
    .select("id")
    .eq("property_code", code)
    .maybeSingle();
  return !error && data !== null;
}

// Get worker's assigned property number range
async function getWorkerNumberRange(tenantId, workerId) {
  const { data } = await supabaseClient
    .from("property_number_ranges")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("worker_id", workerId)
    .maybeSingle();
  return data;
}

// Get app codes assigned to a worker (e.g. ['property', 'family'])
async function getWorkerModules(tenantId, workerId) {
  const { data } = await supabaseClient
    .from("worker_module_assignments")
    .select("app_code")
    .eq("tenant_id", tenantId)
    .eq("worker_id", workerId);
  return (data || []).map(r => r.app_code);
}

// Get app codes assigned to a tenant (e.g. ['property', 'family'])
async function getTenantModules(tenantId) {
  const { data } = await supabaseClient
    .from("tenant_module_assignments")
    .select("app_code")
    .eq("tenant_id", tenantId);
  return (data || []).map(r => r.app_code);
}

// Assign a module to a worker
async function assignModuleToWorker(tenantId, workerId, appCode) {
  const { error } = await supabaseClient
    .from("worker_module_assignments")
    .upsert({ tenant_id: tenantId, worker_id: workerId, app_code: appCode,
               assigned_by: (await getUser())?.id },
             { onConflict: "tenant_id,worker_id,app_code" });
  return !error;
}

// Remove a module from a worker
async function removeModuleFromWorker(tenantId, workerId, appCode) {
  const { error } = await supabaseClient
    .from("worker_module_assignments")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("worker_id", workerId)
    .eq("app_code", appCode);
  return !error;
}

// Get all workers for a tenant (admin use)
async function getTenantWorkers(tenantId) {
  const { data } = await supabaseClient
    .from("profiles")
    .select("id, full_name, phone, role, status, created_at")
    .eq("tenant_id", tenantId)
    .in("role", ["worker", "supervisor"])
    .order("full_name");
  return data || [];
}

// Redirect to the correct dashboard based on role and subdomain
function redirectToDashboard(role) {
  const ctx = window.tenantContext;
  if (role === "super_admin" && ctx.type === "root") {
    window.location.href = "dashboard.html";
  } else if (["admin", "worker", "supervisor"].includes(role) && ctx.type === "tenant") {
    window.location.href = "dashboard.html";
  } else if (role === "super_admin") {
    window.location.href = "https://enga.in/dashboard.html";
  } else {
    window.location.href = "dashboard.html";
  }
}

function waitForSupabase(timeoutMs = 3000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const check = () => {
      if (window.supabaseClient) return resolve(true);
      if (Date.now() - startedAt >= timeoutMs) return resolve(false);
      setTimeout(check, 50);
    };
    check();
  });
}
