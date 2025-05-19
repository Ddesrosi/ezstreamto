import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PremiumFeatureBadge } from './premium-feature-badge';
import { motion } from 'framer-motion';
import { getOrCreateUUID } from '@/lib/search-limits/get-uuid';
import { supabase } from '@/lib/supabaseClient'; // Ajout necessaire pour utiliser supabase

interface PremiumFeatureWrapperProps {
  children: ReactNode;
  isPremium: boolean;
  isLoading?: boolean;
  onPremiumClick: () => void;
  className?: string;
  title: string;
}

export function PremiumFeatureWrapper({
  children,
  isPremium,
  isLoading,
  onPremiumClick,
  className,
  title
}: PremiumFeatureWrapperProps) {
  const uuid = getOrCreateUUID();
  const redirectUrl = encodeURIComponent(`https://ezstreamto.com/premium-success?uuid=${uuid}`);

  // Ajout ici: définir handlePremiumClick avant tous les return
  const handlePremiumClick = async () => {
    try {
      const uuid = getOrCreateUUID();
      const { error } = await supabase
        .from('pre_payments')
        .insert([{ visitor_uuid: uuid }]);

      if (error) {
        console.error('❌ Error inserting pre_payment:', error);
      } else {
        console.log('✅ visitor_uuid inserted into pre_payments:', uuid);
      }

      window.location.href = `https://www.buymeacoffee.com/EzStreamTo?pre_payment_uuid=${uuid}`;
    } catch (error) {
      console.error('Error during premium upgrade:', error);
    }
  };

  if (isLoading) {
    return <div className={className}>{children}</div>;
  }

  if (!isPremium) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative group cursor-pointer",
          className
        )}
        onClick={onPremiumClick}
      >
        <div className="absolute -top-2 -right-2 z-10">
          <PremiumFeatureBadge />
        </div>
        <div className="opacity-50 pointer-events-none filter blur-[0.3px]">
          {children}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
        {/* Premium Feature Tooltip */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <button
  onClick={onPremiumClick}
  className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-blue-700 transition-colors"
>
  Get Premium to Unlock {title}
</button>

        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
