import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function RedirectWithEmail() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const navigate = useNavigate();

  console.log('✅ RedirectWithEmail.tsx loaded');

  useEffect(() => {
    const checkPremiumStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email');

      console.log('📨 URL param email =', email);

      if (!email) {
        console.log('❌ No email found in URL');
        setStatus('error');
        return;
      }

      console.log("📧 Email from URL =", email);

      const { data, error } = await supabase
        .from('supporters')
        .select('email, verified, unlimited_searches')
        .eq('email', email)
        .eq('verified', true)
        .maybeSingle();

      console.log("📦 Supabase result:", { data, error });

      console.log('📦 Supabase result:', { data, error });

      if (error || !data || !data.unlimited_searches) {
        console.log('❌ Premium not verified (missing data or unlimited_searches = false)');
        setStatus('error');
        return;
      }

      localStorage.setItem('isPremium', 'true');
      localStorage.setItem('supporter_email', email);
      localStorage.setItem('visitor_email', email);

      console.log('✅ Premium activated for:', email);
      setStatus('success');

     setTimeout(() => {
  console.log('➡️ Forcing full reload to /');
  window.location.href = '/';
}, 2000); // léger délai allongé pour garantir l'écriture dans localStorage
    };

    checkPremiumStatus();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      {status === 'checking' && <p>⏳ Verifying your Premium access...</p>}
      {status === 'success' && <p>✅ Premium access activated! Redirecting...</p>}
      {status === 'error' && <p>❌ We couldn’t verify your Premium access. Please contact support.</p>}
    </div>
  );
}
