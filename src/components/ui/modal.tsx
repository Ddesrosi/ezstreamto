import { useEffect, memo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
}

export const SearchModal = memo(function SearchModal({ isOpen, onClose, progress }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-[90vw] xs:w-[85vw] sm:w-full max-w-md"
        >
          <div className="bg-gradient-to-b from-blue-600 to-blue-700 rounded-lg shadow-xl p-4 sm:p-6">
            <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
              <div className="relative">
                <Search className="w-10 h-10 sm:w-12 sm:h-12 text-blue-100 animate-pulse" />
                <Loader2 className="w-14 h-14 sm:w-16 sm:h-16 absolute -top-2 -left-2 text-blue-200/30 animate-spin" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  Finding Your Perfect Matches
                </h3>
                <p className="text-sm sm:text-base text-blue-100">
                  Our AI is analyzing thousands of movies and shows to find the best recommendations for you.
                </p>
              </div>

              <div className="w-full space-y-2">
                <div className="h-1.5 sm:h-2 w-full bg-blue-800/50 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-200 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs sm:text-sm text-blue-200">
                  {progress < 65 ? 'This may take a few seconds...' : 
                   progress < 84 ? 'Almost done!' : 'Preparing your recommendations...'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});