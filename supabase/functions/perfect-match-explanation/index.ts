import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
  status: 400,
  headers: { ...corsHeaders, "Content-Type": "application/json" }
});

    }

    const deepseekRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("DEEPSEEK_API_KEY")}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ]
      })
    });

    const deepseekData = await deepseekRes.json();

    const explanation = deepseekData.choices?.[0]?.message?.content?.trim();

   return new Response(JSON.stringify({ explanation }), {
  status: 200,
  headers: { ...corsHeaders, "Content-Type": "application/json" }
});


  } catch (err) {
    console.error("❌ Error generating explanation:", err);
   return new Response(JSON.stringify({ error: "Internal server error" }), {
  status: 500,
  headers: { ...corsHeaders, "Content-Type": "application/json" }
});

  }
});
