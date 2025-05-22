import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useState, useEffect } from 'react';

export default function Disclaimer() {
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
            Disclaimer
          </h1>

          <div className={cn(
            "rounded-lg p-6 mb-6",
            isDark ? 'bg-[#0A1A3F] border border-blue-900/30' : 'bg-white border border-gray-200'
          )}>
            <p className="mb-6">
              EzStreamTo provides movie and TV series recommendations based on user preferences. 
              While we strive to offer accurate and relevant suggestions, EzStreamTo makes no 
              representations or warranties of any kind regarding the completeness, accuracy, 
              or reliability of the recommendations provided.
            </p>

            <h2 className="text-xl font-semibold mb-4">Content Disclaimer</h2>
            <ul className="list-disc pl-6 mb-6">
              <li>Recommendations are provided for informational and entertainment purposes only.</li>
              <li>We do not host, provide, or stream any movies or TV shows directly.</li>
              <li>The availability and accuracy of streaming platforms' content may change without notice.</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">Affiliate and External Links</h2>
            <ul className="list-disc pl-6 mb-6">
              <li>EzStreamTo may contain links to external streaming platforms and other websites. 
                  We have no control over the content and availability of these external sites.</li>
              <li>Clicking external links is at your own risk, and we hold no responsibility for 
                  any issues arising from their usage.</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">Liability</h2>
            <ul className="list-disc pl-6 mb-6">
              <li>EzStreamTo will not be liable for any losses, damages, or inconveniences caused 
                  by reliance on our recommendations or any information on our website.</li>
              <li>Users are advised to verify content availability and details directly with the 
                  respective streaming platforms.</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">Acceptance</h2>
            <p className="mb-6">
              By using EzStreamTo, you agree to this Disclaimer and our Privacy Policy.
            </p>

            <h2 className="text-xl font-semibold mb-4">Contact</h2>
            <p>
              For questions about this Disclaimer, please contact{' '}
              <a 
                href="mailto:info@ezstreamto.com"
                className={cn(
                  "transition-colors",
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                )}
              >
                info@ezstreamto.com
              </a>
            </p>
          </div>
        </motion.div>
      </main>

      <Footer isDark={isDark} />
    </div>
  );
}