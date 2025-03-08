import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const shareMessages = [
  "🎬 Find where to stream your favorite movies and shows with EzStreamTo! 🍿",
  "🔥 Looking for your next movie? Let EzStreamTo guide you! 🎥",
  "📺 The best streaming recommendations are just a click away! Discover now! 🍿",
  "🎥 Can't decide what to watch? Get instant personalized recommendations! 🚀",
  "🍿 Find the perfect movie based on your mood and streaming platform!",
  "🎬 Discover your next favorite movie or TV show with EzStreamTo! 🌟",
  "🎥 Never miss a great movie again - find where to watch it now! 🍿",
  "🚀 Your personal movie guide is here! Find the perfect watch tonight! ✨"
];

export function getRandomShareMessage(): string {
  return shareMessages[Math.floor(Math.random() * shareMessages.length)];
}