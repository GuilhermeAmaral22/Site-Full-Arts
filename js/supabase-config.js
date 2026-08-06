// ==== Conexão com o Supabase ====
const SUPABASE_URL = "https://jjvjoaxfqchvrumkeild.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdmpvYXhmcWNodnJ1bWtlaWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NzA5NjcsImV4cCI6MjEwMTQ0Njk2N30.3sNY52eull534iEr2DNEdmhMQ4IS4dRO9BgHUaWpzNQ";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
