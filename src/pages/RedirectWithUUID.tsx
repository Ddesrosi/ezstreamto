import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function RedirectWithUUID() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const uuid = searchParams.get('uuid');

    if (uuid) {
      console.log('🔁 Storing visitor_id from URL:', uuid);
      localStorage.setItem('visitor_uuid', uuid);

      // Recharger sans le ?uuid pour éviter toute redondance
      setTimeout(() => {
        navigate('/premium-success');
      }, 200);
    } else {
      console.warn('❌ Missing uuid in URL');
      navigate('/');
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white text-lg">
      Preparing your Premium experience...
    </div>
  );
}
