// 🧰 Fonctions utilitaires communes aux Edge Functions

// Nettoie les chaînes de caractères (espaces en trop, caractères invisibles)
export function cleanText(input: string): string {
  return input
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // caractères invisibles
    .trim();
}

// Capitalise la première lettre d’une chaîne
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Génère un ID unique (UUID v4 via crypto API de Deno)
export function generateUUID(): string {
  return crypto.randomUUID(); // Deno standard
}

// Attend un délai en millisecondes
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
