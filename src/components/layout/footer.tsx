import { useState } from 'react';
import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { ContactForm } from '../ui/contact-form';
import { cn } from '@/lib/utils';

interface FooterProps {
  isDark: boolean;
}

export function Footer({ isDark }: FooterProps) {
  const [showContactForm, setShowContactForm] = useState(false);

  return (
    <footer className={cn(
      "w-full border-t py-2 sm:py-3 relative z-0", // ✅ Réduit la hauteur et z-index plus bas
      isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'
    )}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-3">
          {/* Contact Button */}
        <Button
  onClick={() => setShowContactForm(true)}
  className={cn(
    "flex items-center justify-center gap-1 px-6 py-1 text-sm rounded-full transition-all",
    isDark 
      ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-200' 
      : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
  )}
>
  <Mail className="w-4 h-4" />
  Contact Us
</Button>

          {/* Footer Links + Copyright - compact */}
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-center">
            <Link
              to="/privacy"
              className={cn(
                "hover:underline transition-colors",
                isDark ? 'text-blue-200/70 hover:text-blue-200' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Privacy Policy
            </Link>
            <span className={isDark ? 'text-blue-200/40' : 'text-gray-300'}>•</span>
            <Link
              to="/disclaimer"
              className={cn(
                "hover:underline transition-colors",
                isDark ? 'text-blue-200/70 hover:text-blue-200' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Disclaimer
            </Link>
            <span className={isDark ? 'text-blue-200/50' : 'text-gray-400'}>
              © {new Date().getFullYear()} EzStreamTo - All Rights Reserved
            </span>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <ContactForm
          isOpen={showContactForm}
          onClose={() => setShowContactForm(false)}
          isDark={isDark}
        />
      )}
    </footer>
  );
}
