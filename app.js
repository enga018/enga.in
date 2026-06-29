// Supabase initialization

const SUPABASE_URL = "https://ebfasxnaabcutcrpwpxp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmFzeG5hYWJjdXRjcnB3cHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MDMyODgsImV4cCI6MjA5ODI3OTI4OH0.vDAQi82STczY4TOamLVvnco8mzN5Mf07h6jncGSRLRs";

let supabaseClient = null;

function initSupabase() {
  try {
    if (!window.supabase) {
      console.error("Supabase CDN not loaded");
      return;
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.supabaseClient = supabaseClient;
    console.log("Supabase initialized");
  } catch (err) {
    console.error("Supabase init failed:", err);
  }
}

window.addEventListener("load", initSupabase);

window.addEventListener("error", (e) => {
  console.error("JS ERROR:", e.message);
});

async function getUser() {
  const { data } = await supabaseClient.auth.getUser();
  return data?.user ?? null;
}

async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.href = "login.html";
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

function waitForSupabase() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.supabaseClient) return resolve();
      setTimeout(check, 50);
    };
    check();
  });
}
