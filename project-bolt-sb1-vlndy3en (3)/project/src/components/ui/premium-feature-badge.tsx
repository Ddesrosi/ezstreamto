import { Coffee } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumFeatureBadgeProps {
  className?: string;
}

export function PremiumFeatureBadge({ className }: PremiumFeatureBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-medium shadow-lg",
        "border border-amber-300/20",
        className
      )}
    >
      <Coffee className="h-3 w-3" />
      <span>Premium</span>
    </motion.div>
  );
}