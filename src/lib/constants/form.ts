import { Baby, GraduationCap, Home, Users, Sun, Coffee, Zap, Heart, Brain, Compass, Clock, Search, Sword, Mountain, BookOpen, Laugh, Hand as Handcuffs, Drama, Users as Family, Wand2, History, Ghost, Music, HelpCircle, HeartHandshake, Rocket, Trophy, Shield, Skull, Swords, Users as Horse, Timer, TimerOff, PlayCircle, Network as Netflix, ShoppingCart as Amazon, Tv as Disney, Tv2, Apple, Club as Hulu, Crown, Bird, Star, Film, Moon, Brush, Hourglass } from 'lucide-react';

export const moods = [
  { 
    name: 'Happy', 
    icon: Sun,
    tooltip: "Happiness is contagious—let's spread it with a feel-good movie!"
  },
  { 
    name: 'Relaxed', 
    icon: Coffee,
    tooltip: "No stress, just movies. Let's keep the vibe smooth and easy!"
  },
  { 
    name: 'Excited', 
    icon: Zap,
    tooltip: "Fasten your seatbelt—this movie ride is about to get wild!"
  },
  { 
    name: 'Romantic', 
    icon: Heart,
    tooltip: "Get ready for butterflies, grand gestures, and maybe some happy tears!"
  },
  { 
    name: 'Thoughtful', 
    icon: Brain,
    tooltip: "Movies that make you think… because sometimes popcorn isn't enough!"
  },
  { 
    name: 'Adventurous', 
    icon: Compass,
    tooltip: "Ideal if you're craving danger (but like, the kind you can experience in sweatpants)."
  },
  { 
    name: 'Nostalgic', 
    icon: Clock,
    tooltip: "Let's dust off the classics and relive some childhood magic!"
  },
  { 
    name: 'Mysterious', 
    icon: Search,
    tooltip: "Secrets, clues, and shocking reveals—your detective training starts now!"
  }
] as const;

export const genres = [
  { name: 'Action', icon: Sword },
  { name: 'Adventure', icon: Mountain },
  { name: 'Animation', icon: Brush }, // Changed to Brush for better representation of animation/drawing
  { name: 'Biography', icon: BookOpen },
  { name: 'Comedy', icon: Laugh },
  { name: 'Crime', icon: Handcuffs },
  { name: 'Documentary', icon: Film },
  { name: 'Drama', icon: Drama },
  { name: 'Family', icon: Family },
  { name: 'Fantasy', icon: Wand2 },
  { name: 'Film-Noir', icon: Moon },
  { name: 'History', icon: History },
  { name: 'Horror', icon: Ghost },
  { name: 'Musical', icon: Music },
  { name: 'Mystery', icon: HelpCircle },
  { name: 'Romance', icon: HeartHandshake },
  { name: 'Sci-Fi', icon: Rocket },
  { name: 'Sport', icon: Trophy },
  { name: 'Superhero', icon: Shield },
  { name: 'Thriller', icon: Skull },
  { name: 'War', icon: Swords },
  { name: 'Western', icon: Horse } // Already using Horse for Western theme
] as const;

export const streamingServices = [
  { name: 'Netflix', icon: Netflix },
  { name: 'Amazon Prime', icon: Amazon },
  { name: 'Disney+', icon: Disney },
  { name: 'HBO Max', icon: Crown },
  { name: 'Apple TV+', icon: Apple },
  { name: 'Hulu', icon: Tv2 },
  { name: 'Paramount+', icon: Film },
  { name: 'Peacock', icon: Bird }
] as const;

export const timePresets = [
  { label: 'Classic Era (1920-1959)', range: { from: 1920, to: 1959 }, icon: History },
  { label: 'New Hollywood (1960-1979)', range: { from: 1960, to: 1979 }, icon: Film },
  { label: 'Blockbuster Era (1980-1999)', range: { from: 1980, to: 1999 }, icon: Star },
  { label: 'Modern Cinema (2000-2010)', range: { from: 2000, to: 2010 }, icon: Rocket },
  { label: 'Contemporary (2011-Present)', range: { from: 2011, to: new Date().getFullYear() }, icon: Zap }
] as const;

export const ratingPresets = [
  { label: 'Any Rating', range: { min: 0, max: 10 }, icon: Star },
  { label: 'Good (5+)', range: { min: 5, max: 10 }, icon: Star },
  { label: 'Very Good (7+)', range: { min: 7, max: 10 }, icon: Star },
  { label: 'Excellent (8+)', range: { min: 8, max: 10 }, icon: Star }
] as const;