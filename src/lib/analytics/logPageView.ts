import { supabase } from '@/lib/supabaseClient';
import { getClientIp } from '@/lib/search-limits/get-ip';
import { getOrCreateUUID } from '@/lib/search-limits/get-uuid';

export async function logPageView() {
  const ip = await getClientIp();
  const uuid = getOrCreateUUID();

  if (!ip) {
    console.warn("⚠️ IP not found. Page view not logged.");
    return;
  }

  const { error } = await supabase.from("page_views").insert([
    {
      ip_address: ip,
      uuid,
    },
  ]);

  if (error) {
    console.error("❌ Error logging page view:", error.message);
  } else {
    console.log(`✅ Page view logged with IP: ${ip} and UUID: ${uuid}`);
  }
}
