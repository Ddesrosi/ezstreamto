import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lock, Zap, Clock, Skull, Shield, Cpu, Swords, Mountain, Moon, Key, Compass, Sun, Brush, Video, PocketKnife as Knife, Rocket, Cog, Users, Car, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KEYWORD_CATEGORIES } from '@/lib/constants/keywords';

const iconMap = {
  Zap,
  Clock,
  Skull,
  Shield,
  Cpu,
  Swords,
  Mountain,
  Moon,
  Key,
  Compass,
  Sun,
  Brush,
  Video,
  Knife,
  Rocket,
  Cog,
  Users,
  Car,
  Heart
} as const;

interface KeywordSelectorProps {
  isPremium: boolean;
  onPremiumClick: () => void;
  selectedKeywords: string[];
  onKeywordSelect: (keyword: string) => void;
  isDark: boolean;
}

export function KeywordSelector({
  isPremium,
  onPremiumClick,
  selectedKeywords,
  onKeywordSelect,
  isDark
}: KeywordSelectorProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleCategoryClick = (category: string) => {
    if (!isPremium) {
      onPremiumClick();
      return;
    }
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    if (!isPremium) {
      onPremiumClick();
      return;
    }
    onKeywordSelect(subcategory);
  };

  return (
    <div className="space-y-2">
      {/* Premium Badge */}
      {!isPremium && (
        <div className={cn(
          "flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg",
          isDark ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-600'
        )}>
          <Lock className="h-4 w-4 text-amber-400" />
          <span className="text-sm">Premium feature - Unlock advanced filtering</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 relative">
        {Object.entries(KEYWORD_CATEGORIES).map(([category, { icon, subcategories }]) => {
          const IconComponent = iconMap[icon as keyof typeof iconMap];
          const isExpanded = expandedCategory === category;
          const hasSelectedSubcategories = subcategories.some(sub => 
            selectedKeywords.includes(sub)
          );

          return (
            <div key={category} className="relative">
              <motion.button
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm font-medium",
                  "flex items-center justify-between gap-2",
                  "transition-all duration-200",
                  isDark
                    ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-100'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-800',
                  hasSelectedSubcategories && (
                    isDark
                      ? 'ring-2 ring-blue-500'
                      : 'ring-2 ring-blue-400'
                  ),
                  !isPremium && 'opacity-75'
                )}
                whileHover={{ scale: isPremium ? 1.02 : 1 }}
                whileTap={{ scale: isPremium ? 0.98 : 1 }}
              >
                <span className="flex items-center gap-2 truncate">
                  <IconComponent className="h-4 w-4" />
                  <span className="truncate">{category}</span>
                </span>
                {!isPremium ? (
                  <Lock className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 flex-shrink-0 transition-transform",
                      isExpanded && "transform rotate-180"
                    )}
                  />
                )}
              </motion.button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "absolute z-10 top-full left-0 right-0 mt-1",
                      "rounded-lg shadow-lg overflow-hidden",
                      isDark ? 'bg-[#0A1A3F]' : 'bg-white',
                      'border',
                      isDark ? 'border-blue-900/30' : 'border-gray-200'
                    )}
                  >
                    {subcategories.map((subcategory) => (
                      <button
                        key={subcategory}
                        onClick={() => handleSubcategoryClick(subcategory)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm",
                          "transition-colors duration-200",
                          "flex items-center justify-between",
                          isDark
                            ? 'hover:bg-blue-900/30 text-blue-100'
                            : 'hover:bg-blue-50 text-gray-700',
                          !isPremium && 'opacity-50',
                          selectedKeywords.includes(subcategory) && (
                            isDark
                              ? 'bg-blue-900/40 text-blue-200'
                              : 'bg-blue-100 text-blue-800'
                          )
                        )}
                      >
                        <span className="truncate">{subcategory}</span>
                        {selectedKeywords.includes(subcategory) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={cn(
                              "h-2 w-2 rounded-full",
                              isDark ? 'bg-blue-400' : 'bg-blue-500'
                            )}
                          />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {selectedKeywords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mt-3"
        >
          {selectedKeywords.map(keyword => (
            <motion.span
              key={keyword}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                isDark
                  ? 'bg-blue-900/30 text-blue-200'
                  : 'bg-blue-100 text-blue-800'
              )}
            >
              {keyword}
              <button
                onClick={() => onKeywordSelect(keyword)}
                className="hover:text-red-500 transition-colors ml-1"
              >
                ×
              </button>
            </motion.span>
          ))}
        </motion.div>
      )}
    </div>
  );
}