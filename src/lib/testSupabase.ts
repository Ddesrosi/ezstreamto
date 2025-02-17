import { supabase } from "./supabaseClient";

async function testConnection() {
    console.log("🔄 Testing Supabase connection...");

    // Try fetching data from the 'supporters' table
    const { data, error } = await supabase.from("supporters").select("*");

    if (error) {
        console.error("❌ Supabase Connection Error:", error);
    } else {
        console.log("✅ Supabase Connected! Supporters:", data);
    }
}

testConnection();