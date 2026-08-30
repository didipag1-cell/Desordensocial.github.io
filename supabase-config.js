/* =========================================================
   SUPABASE — DESORDEN SOCIAL
========================================================= */

const SUPABASE_URL =
    "https://vomccqnimuiysdabzslk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_nTqXyHD94PGkkx8Bl6wN1Q_8JvHy_C9";


window.db =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );