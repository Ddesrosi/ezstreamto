import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useState, useEffect } from 'react';

export default function Privacy() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      isDark ? 'bg-[#040B14] text-white' : 'bg-gray-50 text-gray-900'
    )}>
      <Header isDark={isDark} onThemeToggle={toggleTheme} />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "prose max-w-3xl mx-auto",
            isDark ? 'prose-invert' : 'prose-gray'
          )}
        >
          <h1 className={cn(
            "text-3xl font-bold mb-6",
            isDark ? 'text-blue-100' : 'text-gray-900'
          )}>
            Privacy Policy
          </h1>

          <div className={cn(
            "rounded-lg p-6 mb-6",
            isDark ? 'bg-[#0A1A3F] border border-blue-900/30' : 'bg-white border border-gray-200'
          )}>
            <p className="mb-6">
              EzStreamTo ("we," "our," or "us") respects your privacy and is committed to protecting 
              the personal data we collect from you. This Privacy Policy explains how we collect, use, 
              and safeguard your information when you visit our website.
            </p>

            <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
            <ul className="list-disc pl-6 mb-6">
              <li><strong>Personal Information:</strong> When you use our contact form, we collect your 
                  email address and message solely for communication purposes.</li>
              <li><strong>Usage Data:</strong> We may collect information about your visits, IP address, 
                  browser type, operating system, referral sources, pages viewed, and the duration of 
                  your visit for analytics purposes.</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="mb-2">We use your information solely to:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Respond to your inquiries.</li>
              <li>Improve our website and services.</li>
              <li>Ensure proper functionality and enhance user experience.</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">Data Security</h2>
            <p className="mb-6">
              We implement industry-standard security measures to protect your information from 
              unauthorized access or disclosure.
            </p>

            <h2 className="text-xl font-semibold mb-4">Sharing Your Information</h2>
            <p className="mb-6">
              We do not sell, rent, or share your personal data with third parties unless legally 
              obligated to do so by applicable law.
            </p>

            <h2 className="text-xl font-semibold mb-4">Cookies</h2>
            <p className="mb-6">
              EzStreamTo may use cookies to enhance user experience. You may disable cookies in your 
              browser settings, but doing so may affect the functionality of our site.
            </p>

            <h2 className="text-xl font-semibold mb-4">Third-Party Links</h2>
            <p className="mb-6">
              Our website contains links to third-party sites (e.g., streaming platforms). We are not 
              responsible for their privacy practices or content.
            </p>

            <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="mb-6">
              We reserve the right to update this Privacy Policy. We encourage you to periodically 
              review this page for changes.
            </p>

            <h2 className="text-xl font-semibold mb-4">Contact</h2>
            <p>
              If you have any questions regarding this policy, contact us at{' '}
              <a 
                href="mailto:ezstreamto@gmail.com"
                className={cn(
                  "transition-colors",
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                )}
              >
                ezstreamto@gmail.com
              </a>
            </p>
          </div>
        </motion.div>
      </main>

      <Footer isDark={isDark} />
    </div>
  );
}