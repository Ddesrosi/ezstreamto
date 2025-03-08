import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock, Wand2, BookOpen, ThumbsUp, Compass, Crown } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils'; 
import { useEffect, useRef } from 'react';

interface PerfectMatchProps {
  isPremium: boolean;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onUpgrade: () => void;
  isDark: boolean;
}

export function PerfectMatch({ 
  isPremium, 
  isEnabled, 
  onToggle, 
  onUpgrade,
  isDark 
}: PerfectMatchProps) {
  const animationFrameIds = useRef<number[]>([]);

  // Cleanup any potential animation timeouts on unmount
  useEffect(() => {
    return () => {
      // Cancel all stored animation frames
      if (animationFrameIds.current.length > 0) {
        animationFrameIds.current.forEach(id => {
          window.cancelAnimationFrame(id);
        });
        animationFrameIds.current = [];
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.6 }}
      className={cn(
        "relative p-4 sm:p-6 rounded-lg border",
        isDark 
          ? 'bg-[#0A1A3F] border-blue-900/30' 
          : 'bg-white border-gray-200'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent",
              isDark ? 'text-blue-100' : 'text-gray-900'
            )}>
              Your Perfect Match
            </h3>
            <Crown className="h-4 w-4 text-amber-400" />
          </div>
          
          <p className={cn(
            "mt-2 text-sm sm:text-base leading-relaxed",
            isDark ? 'text-blue-200/70' : 'text-gray-600'
          )}>
            Unlock a tailor-made movie recommendation, designed just for YOU! Our AI carefully selects the ultimate movie based on your preferences and tells you exactly why it's your perfect match!
          </p>

          {/* Benefits List */}
          <div className="mt-4 space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", delay: 0.1, duration: 0.5 }}
              className={cn(
                "flex items-center gap-2 text-sm",
                isDark ? 'text-blue-200' : 'text-gray-700'
              )}
            >
              <Wand2 className="h-4 w-4 text-amber-400" />
              <span>Your #1 Movie Match – The AI selects the absolute best movie for you</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", delay: 0.2, duration: 0.5 }}
              className={cn(
                "flex items-center gap-2 text-sm",
                isDark ? 'text-blue-200' : 'text-gray-700'
              )}
            >
              <BookOpen className="h-4 w-4 text-amber-400" />
              <span>Exclusive Deep Dive Insights – Understand why this film is your perfect match</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", delay: 0.3, duration: 0.5 }}
              className={cn(
                "flex items-center gap-2 text-sm",
                isDark ? 'text-blue-200' : 'text-gray-700'
              )}
            >
              <ThumbsUp className="h-4 w-4 text-amber-400" />
              <span>3 Hand-Picked Recommendations – Discover additional movies tailored to you</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", delay: 0.4, duration: 0.5 }}
              className={cn(
                "flex items-center gap-2 text-sm",
                isDark ? 'text-blue-200' : 'text-gray-700'
              )}
            >
              <Compass className="h-4 w-4 text-amber-400" />
              <span>One Click = Instant Decision – Stop scrolling endlessly, let AI choose for you</span>
            </motion.div>
          </div>
          {!isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", delay: 0.5, duration: 0.5 }}
              className="mt-6 flex items-center gap-2"
            >
              <Lock className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-amber-400">
                Premium feature
              </p>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isEnabled}
              onChange={(e) => {
                if (!isPremium) {
                  onUpgrade();
                  return;
                }
                onToggle(e.target.checked);
              }}
            />
            <div className={cn(
              "w-11 h-6 rounded-full peer",
              "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
              "after:bg-white after:rounded-full after:h-5 after:w-5",
              "after:transition-all peer-checked:after:translate-x-full",
              isDark
                ? 'bg-blue-900/50 peer-checked:bg-amber-500'
                : 'bg-gray-200 peer-checked:bg-amber-500'
            )}></div>
          </label>

          {!isPremium && (
            <Button
              variant="ghost"
              size="md"
              onClick={onUpgrade}
              className={cn(
                "text-sm font-medium px-4 py-2",
                "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
                "text-white shadow-lg hover:shadow-xl transition-all duration-300"
              )}
            >
              Unlock Now
            </Button>
          )}
        </div>
      </div>

      {isEnabled && isPremium && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ type: "spring", duration: 0.6 }}
          className={cn(
            "mt-6 pt-4 border-t",
            isDark ? 'border-blue-900/20' : 'border-gray-200/50'
          )}
        >
          <p className={cn(
            "text-sm",
            isDark ? 'text-blue-200/70' : 'text-gray-600'
          )}>
            Get ready for a personalized movie journey! Our AI will analyze your unique preferences to find 
            your ideal match, complete with detailed insights on why this movie is perfect for you.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}