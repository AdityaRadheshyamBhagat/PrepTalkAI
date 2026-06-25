import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_CLOUD_TTS_API_KEY");

    // 1. Call Google Cloud TTS API
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "en-US", name: "en-US-Standard-C" }, // Highly natural female voice
        audioConfig: { audioEncoding: "MP3" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Google TTS Error:", err);
      throw new Error("Failed to generate audio");
    }

    const data = await response.json();
    
    // 2. Convert base64 string to binary
    const audioBinary = Uint8Array.from(atob(data.audioContent), (c) => c.charCodeAt(0));

    // 3. Return as mp3
    return new Response(audioBinary, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});