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
      "w-full border-t py-4 sm:py-6 relative z-10",
      isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'
    )}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          {/* Contact Button */}
          <Button
            onClick={() => setShowContactForm(true)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-full transition-all",
              isDark 
                ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-200' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
            )}
          >
            <Mail className="w-3.5 h-3.5" />
            Contact Us
          </Button>
          
          {/* Links */}
          <div className="flex items-center gap-4 text-xs">
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
          </div>
          
          {/* Copyright */}
          <p className={cn(
            "text-xs text-center",
            isDark ? 'text-blue-200/50' : 'text-gray-400'
          )}>
            © {new Date().getFullYear()} EzStreamTo - All Rights Reserved
          </p>
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