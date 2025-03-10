import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Send } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function ContactForm({ isOpen, onClose, isDark }: ContactFormProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative z-[10000] w-full max-w-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={`w-full rounded-lg shadow-xl backdrop-blur-lg overflow-hidden transition-all ${isDark ? 'bg-[#0A1A3F] border border-blue-900/30' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between p-4 border-b border-blue-900/20">
              <div className="flex items-center gap-2">
                <Mail className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-lg font-semibold ${isDark ? 'text-blue-100' : 'text-gray-900'}`}>
                  Contact Us
                </h2>
              </div>
              <button
                onClick={onClose}
                className={`rounded-full p-2 transition-colors ${isDark ? 'hover:bg-blue-900/50 text-blue-200' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!submitted ? (
              <form
                name="contact"
                method="POST"
                data-netlify="true"
                netlify-honeypot="bot-field"
                onSubmit={(e) => {
  e.preventDefault();
  setSubmitted(true);
  (e.target as HTMLFormElement).submit();
}}

                className="p-6 space-y-4"
              >
                <input type="hidden" name="form-name" value="contact" />
                <div hidden>
                  <input name="bot-field" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className={`block text-sm font-medium ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md transition-colors duration-200 border focus:outline-none focus:ring-2 ${isDark ? 'bg-blue-900/20 border-blue-900/30 text-blue-100' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className={`block text-sm font-medium ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className={`w-full px-3 py-2 rounded-md transition-colors duration-200 ${isDark ? 'bg-blue-900/20 border-blue-900/30 text-blue-100' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="Your message..."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" className={`flex items-center gap-2 ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center">
                <p className={`text-lg ${isDark ? 'text-blue-100' : 'text-gray-800'}`}>
                  Your message was sent successfully!
                </p>
                <button
                  onClick={onClose}
                  className={`mt-4 px-4 py-2 rounded ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
