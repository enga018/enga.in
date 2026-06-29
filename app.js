const supabaseUrl = "https://ebfasxnaabcutcrpwpxp.supabase.co";
const supabaseKey = "sb_publishable_-vezxvTfAsS1e2xilOq5Bw_aPqsomZr";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// expose single client
window.supabaseClient = supabase;

console.log("Supabase client loaded");