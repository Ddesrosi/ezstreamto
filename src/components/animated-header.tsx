import { motion } from 'framer-motion';

interface AnimatedHeaderProps {
  isDark: boolean;
}

export function AnimatedHeader({ isDark }: AnimatedHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center py-12"
    >
      <h1 className={`text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent ${
        isDark ? 'bg-gradient-to-r from-blue-100 to-blue-400' : 'bg-gradient-to-r from-blue-600 to-blue-800'
      }`}>
        Find Your Perfect Watch
      </h1>
      <p className={`text-xl ${isDark ? 'text-blue-200/70' : 'text-blue-800/70'} leading-relaxed`}>
        Discover movies and TV shows tailored to your mood and preferences
      </p>
    </motion.div>
  );
}