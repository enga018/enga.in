// Robust Supabase initialization (prevents crash)

const supabaseUrl = "https://ebfasxnaabcutcrpwpxp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZmFzeG5hYWJjdXRjcnB3cHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MDMyODgsImV4cCI6MjA5ODI3OTI4OH0.vDAQi82STczY4TOamLVvnco8mzN5Mf07h6jncGSRLRs";

let supabaseClient = null;

function initSupabase() {
  try {
    if (!window.supabase) {
      console.error("Supabase CDN not loaded");
      return;
    }

    supabaseClient = window.supabase.createClient(
      supabaseUrl,
      supabaseKey
    );

    console.log("Supabase client initialized");
  } catch (err) {
    console.error("Supabase init failed:", err);
  }

  window.supabaseClient = supabaseClient;
}

// wait until DOM + CDN is ready
window.addEventListener("load", initSupabase);

// global debugging
window.addEventListener("error", (e) => {
  console.error("JS ERROR:", e.message);
});
