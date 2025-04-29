import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function RedirectWithEmail() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const navigate = useNavigate();

  useEffect(() => {
    const checkPremiumStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email');

      if (!email) {
        setStatus('error');
        return;
      }

      const { data, error } = await supabase
        .from('supporters')
        .select('email, verified, unlimited_searches')
        .eq('email', email)
        .eq('verified', true)
        .maybeSingle();

      if (error || !data || !data.unlimited_searches) {
        setStatus('error');
        return;
      }

      localStorage.setItem('isPremium', 'true');
      localStorage.setItem('supporter_email', email);

      setStatus('success');
      setTimeout(() => navigate('/'), 1500);
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
