import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Send, Loader2 } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!email || !message) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('https://formspree.io/f/xzblzgkv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          _replyto: email,
          message: message,
          _subject: `New Contact Form Message from ${email}`
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to send message');
      }

      setShowSuccess(true);
      setEmail('');
      setMessage('');
      
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to send message. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
          className={cn(
            "w-full rounded-lg shadow-xl backdrop-blur-lg",
            "overflow-hidden transition-all",
            isDark ? 'bg-[#0A1A3F] border border-blue-900/30' : 'bg-white'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-900/20">
            <div className="flex items-center gap-2">
              <Mail className={cn(
                "h-5 w-5",
                isDark ? 'text-blue-400' : 'text-blue-600'
              )} />
              <h2 className={cn(
                "text-lg font-semibold",
                isDark ? 'text-blue-100' : 'text-gray-900'
              )}>
                Contact Us
              </h2>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "rounded-full p-2 transition-colors",
                isDark 
                  ? 'hover:bg-blue-900/50 text-blue-200' 
                  : 'hover:bg-gray-100 text-gray-500'
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className={cn(
                  "block text-sm font-medium",
                  isDark ? 'text-blue-200' : 'text-gray-700'
                )}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-md",
                  "transition-colors duration-200",
                  isDark 
                    ? 'bg-blue-900/20 border-blue-900/30 text-blue-100 placeholder-blue-300/30' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                  "border focus:outline-none focus:ring-2",
                  isDark
                    ? 'focus:border-blue-500 focus:ring-blue-500/20'
                    : 'focus:border-blue-500 focus:ring-blue-500/20'
                )}
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="message" 
                className={cn(
                  "block text-sm font-medium",
                  isDark ? 'text-blue-200' : 'text-gray-700'
                )}
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className={cn(
                  "w-full px-3 py-2 rounded-md",
                  "transition-colors duration-200",
                  isDark 
                    ? 'bg-blue-900/20 border-blue-900/30 text-blue-100 placeholder-blue-300/30' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                  "border focus:outline-none focus:ring-2",
                  isDark
                    ? 'focus:border-blue-500 focus:ring-blue-500/20'
                    : 'focus:border-blue-500 focus:ring-blue-500/20'
                )}
                placeholder="Your message..."
              />
            </div>

            {error && (
              <p className={cn(
                "text-sm",
                isDark ? 'text-red-400' : 'text-red-600'
              )}>
                {error}
              </p>
            )}

            {showSuccess && (
              <p className={cn(
                "text-sm",
                isDark ? 'text-green-400' : 'text-green-600'
              )}>
                Message sent successfully! We'll get back to you soon.
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2",
                  isDark 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
    </AnimatePresence>
  );
}