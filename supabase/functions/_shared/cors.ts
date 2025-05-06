// ✅ supabase/functions/_shared/cors.ts

export function getCorsHeaders(origin: string | null): { [key: string]: string } {
  const allowedOrigins = [
    "https://ezstreamto.com",
    "http://localhost:5173",
    "https://www.ezstreamto.com",
    "https://localhost:5173",
     "https://bolt.new" 
  ];

  const isAllowed =
    !!origin &&
    (allowedOrigins.includes(origin) || origin.endsWith(".local-credentialless.webcontainer-api.io"));

  console.log("🌐 Origin received:", origin);
  console.log("✅ CORS allowed:", isAllowed);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin! : "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400"
  };
}
