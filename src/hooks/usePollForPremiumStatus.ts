import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function usePollForPremiumStatus(shouldPoll: boolean) {
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const visitor_id = localStorage.getItem('visitor_id');
    const prePaymentUUID = localStorage.getItem('pre_payment_uuid');

    // ✅ Démarrer le polling si l'utilisateur a atteint 0 recherches OU vient de faire un paiement
    const isEligibleToPoll = shouldPoll || !!prePaymentUUID;
    if (!isEligibleToPoll || !visitor_id) return;

    let attempts = 0;
    const maxAttempts = 9;

    const checkPremium = async () => {
      const { data, error } = await supabase
        .from('supporters')
        .select('visitor_uuid, verified')
        .eq('visitor_uuid', visitor_id)
        .eq('verified', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Error checking Premium status:', error.message);
        return;
      }

      if (data && data.verified) {
        console.log('✅ Premium status confirmed via polling');
        localStorage.setItem('isPremium', 'true');
        localStorage.removeItem('pre_payment_uuid'); // ✅ Nettoyer après succès
        if (pollingRef.current) clearInterval(pollingRef.current);
      } else {
        console.log('⏳ Polling... not Premium yet');
      }

      attempts++;
      if (attempts >= maxAttempts && pollingRef.current) {
        clearInterval(pollingRef.current);
        console.log('⛔ Max polling attempts reached');
      }
    };

    pollingRef.current = setInterval(checkPremium, 10000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [shouldPoll]);
}
