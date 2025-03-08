import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumBadgeProps {
  className?: string;
}

export function PremiumBadge({ className = '' }: PremiumBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-white text-xs font-medium ${className}`}
    >
      <Crown className="h-3 w-3" />
      <span>Premium</span>
    </motion.div>
  );
}