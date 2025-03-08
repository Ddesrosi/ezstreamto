import { motion } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
              "text-base sm:text-lg font-semibold",
              isDark ? 'text-blue-100' : 'text-gray-900'
            )}>
              Your Perfect Match
            </h3>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          
          <p className={cn(
            "mt-1 text-sm",
            isDark ? 'text-blue-200/70' : 'text-gray-600'
          )}>
            Let our AI find your ideal movie with personalized insights on why it's perfect for you.
          </p>

          {!isPremium && (
            <div className="mt-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-amber-400">
                Premium feature
              </p>
            </div>
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
              size="sm"
              onClick={onUpgrade}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {isEnabled && isPremium && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-blue-900/20"
        >
          <p className={cn(
            "text-sm",
            isDark ? 'text-blue-200/70' : 'text-gray-600'
          )}>
            We'll analyze your preferences in detail to find the movie that best matches your taste, 
            complete with an explanation of why it's your perfect match.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}