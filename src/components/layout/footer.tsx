import { useState } from 'react';
import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
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
      "w-full border-t py-8 relative",
      isDark ? 'bg-[#0A1A3F] border-blue-900/30' : 'bg-white border-gray-200'
    )}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6">
          {/* Contact Button */}
          <Button
            onClick={() => setShowContactForm(true)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full transition-all",
              isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            )}
          >
            <Mail className="w-4 h-4" />
            Contact Us
          </Button>
          
          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <a 
              href="/privacy"
              target="_self"
              className={cn(
                "hover:underline transition-colors",
                isDark ? 'text-blue-200 hover:text-blue-100' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Privacy Policy
            </a>
            <a 
              href="/disclaimer"
              target="_self"
              className={cn(
                "hover:underline transition-colors",
                isDark ? 'text-blue-200 hover:text-blue-100' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Disclaimer
            </a>
          </div>
          
          {/* Copyright */}
          <p className={cn(
            "text-sm text-center",
            isDark ? 'text-blue-200/70' : 'text-gray-500'
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