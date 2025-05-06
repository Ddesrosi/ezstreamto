// 📝 Centralized logging helpers for Supabase Edge Functions

export function logInfo(message: string, data?: unknown) {
  console.log(`ℹ️ ${message}`);
  if (data) console.log(data);
}

export function logSuccess(message: string, data?: unknown) {
  console.log(`✅ ${message}`);
  if (data) console.log(data);
}

export function logWarning(message: string, data?: unknown) {
  console.warn(`⚠️ ${message}`);
  if (data) console.warn(data);
}

export function logError(message: string, error?: unknown) {
  console.error(`❌ ${message}`);
  if (error) console.error(error);
}

export function logDeepseekError(error: any, context?: string) {
  console.error(`❌ Deepseek API Error${context ? " during " + context : ""}:`);
  if (error?.response) {
    console.error("Status:", error.response.status);
    console.error("Data:", error.response.data);
  } else {
    console.error(error);
  }
}
