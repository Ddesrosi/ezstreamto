import { Menu, Moon, Sun, Facebook } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { Logo } from '../ui/logo';

interface HeaderProps {
  isDark: boolean;
  onThemeToggle: () => void;
}

export function Header({ isDark, onThemeToggle }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const shareOnFacebook = () => {
    const url = encodeURIComponent(`${window.location.href}?v=${Date.now()}`);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const shareOnX = () => {
    const text = encodeURIComponent('🎬 Find where to stream your favorite movies and shows with EzStreamTo! 🍿');
    const url = encodeURIComponent(window.location.href);
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-lg shadow-lg transition-all duration-300 ${
        isDark
          ? 'border-blue-900/30 bg-[#040B14] bg-opacity-95'
          : 'border-gray-200 bg-white bg-opacity-95'
      } relative overflow-hidden`}
    >
      {/* Stronger Animated Background Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent blur-xl opacity-40 animate-pulse"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      ></motion.div>
      
      <div className="max-w-[2000px] mx-auto px-3 sm:px-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-20 py-3 sm:py-0 gap-3 sm:gap-0">
          {/* Logo */}
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="flex items-center"
          >
            <Logo 
              size={isMenuOpen ? "sm" : "lg"}
              className={isDark ? 'text-blue-500' : 'text-blue-600'} 
              showText={true}
              textColor={isDark ? 'text-white' : 'text-gray-900'}
            />
          </motion.a>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden absolute right-3 top-3"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Social Sharing & Theme Toggle */}
          <div className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-6 w-full sm:w-auto ${isMenuOpen ? 'block' : 'hidden sm:flex'}`}>
            <div className="flex items-center gap-2 sm:gap-4">
              {[
                { 
                  icon: () => (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  ),
                  action: shareOnX,
                  title: "Share on X"
                },
                { icon: Facebook, action: shareOnFacebook, title: "Share on Facebook" }
              ].map(({ icon: Icon, action, title }, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.2, rotate: [0, 5, -5, 0] }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Button
                    variant="ghost"
                    onClick={action}
                    className="group w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full hover:shadow-lg hover:scale-110 transition-all duration-300"
                    title={title}
                  >
                    <Icon className="h-5 w-5 sm:h-7 sm:w-7 group-hover:text-blue-500 transition-all" />
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Theme Toggle */}
            <motion.div whileHover={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Button
                variant="ghost"
                className="group w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full hover:shadow-lg hover:scale-110 transition-all duration-300"
                onClick={onThemeToggle}
              >
                <Sun className={`h-5 w-5 sm:h-6 sm:w-6 transition-all ${isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
                <Moon className={`absolute h-5 w-5 sm:h-6 sm:w-6 transition-all ${isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}