import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Check, Loader2, Coffee } from 'lucide-react';
import { Button } from './button';
import { usePremiumUpgrade } from '@/hooks/usePremiumUpgrade';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function PremiumModal({ isOpen, onClose, onUpgrade }: PremiumModalProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { upgradeToPremium, isProcessing, error } = usePremiumUpgrade();

  const benefits = [
    'Unlimited Searches',
    'Advanced filtering options',
    'Early access to new features',
    'Support independent developers'
  ];

  const handleUpgrade = async () => {
    try {
      // Open Buy Me a Coffee in a new window
      window.open('https://www.buymeacoffee.com/EzStreamTo', '_blank');
      
      // Close the modal
      onClose();
      
      // Call the parent's onUpgrade callback
      onUpgrade();
    } catch (err) {
      console.error('Upgrade error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-[90vw] xs:w-[85vw] sm:w-full max-w-lg bg-gradient-to-b from-blue-600 to-blue-700 rounded-xl shadow-xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Content */}
          <div className="p-4 sm:p-6 text-center">
            <motion.div
              animate={{ rotate: isHovering ? [0, -10, 10, 0] : 0 }}
              onHoverStart={() => setIsHovering(true)}
              onHoverEnd={() => setIsHovering(false)}
              className="inline-block mb-3 sm:mb-4"
            >
              <Coffee className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400" />
            </motion.div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Support Us with a Coffee!
            </h2>
            <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6">
              For only $5, unlock unlimited searches and support our work
            </p>

            {/* Benefits List */}
            <div className="space-y-2 sm:space-y-3 text-left mb-4 sm:mb-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 text-blue-100"
                >
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded bg-red-500/20 text-red-200 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Upgrade Button */}
            <Button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="w-full h-10 sm:h-12 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Buy me a coffee ($5)</span>
                </div>
              )}
            </Button>

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-blue-200">
              One-time payment for unlimited searches
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}