import { supabase } from '@/lib/supabaseClient';
import { getClientIp } from '@/lib/search-limits/get-ip';
import { getOrCreateUUID } from '@/lib/search-limits/get-uuid';

export async function logPageView() {
  // 🛑 Protection anti-doublon dans la session
  if (sessionStorage.getItem('hasLoggedPageView')) {
    console.log('⏭️ Page view already logged this session');
    return;
  }

  sessionStorage.setItem('hasLoggedPageView', 'true');

  const ip = await getClientIp();
  const uuid = getOrCreateUUID();

  // 🛑 Protection si IP manquante
  if (!ip) {
    console.warn("⚠️ IP not found. Page view not logged.");
    return;
  }

  // 🛑 Protection si UUID manquant ou invalide
  if (!uuid || uuid === 'null') {
    console.warn("⚠️ UUID is missing or invalid. Page view not logged.");
    return;
  }

  // 📥 Insertion dans Supabase
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
