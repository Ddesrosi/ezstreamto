// 🔐 Centralize config access for secrets like Deepseek API key
export function getDeepseekApiKey(): string {
  const key = Deno.env.get("DEEPSEEK_API_KEY");

  if (!key) {
    console.error("❌ Missing DEEPSEEK_API_KEY in environment variables.");
    throw new Error("Missing DEEPSEEK_API_KEY");
  }

  return key;
}
