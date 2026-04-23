import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Persona {
  id: string;
  name: string;
  role: string;
  viewpoint: string;
}

interface Turn {
  speakerId: string; // persona id, "moderator", or "user"
  speakerName: string;
  text: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, personas, history, nextSpeakerId, openingPrompt } = await req.json() as {
      topic: string;
      personas: Persona[];
      history: Turn[];
      nextSpeakerId: string;
      openingPrompt?: string;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isModerator = nextSpeakerId === "moderator";
    const persona = personas.find((p) => p.id === nextSpeakerId);

    let systemPrompt: string;
    if (isModerator) {
      systemPrompt = `You are the Moderator of a live group discussion on: "${topic}".
Panelists: ${personas.map((p) => `${p.name} (${p.role})`).join(", ")}.
Your job: introduce the topic warmly in 2-3 sentences, then invite the first panelist to share their view. Be neutral and concise. Do NOT take sides.`;
    } else if (persona) {
      systemPrompt = `You are ${persona.name}, role: "${persona.role}". Your stance: ${persona.viewpoint}.
You are participating in a live group discussion on: "${topic}".
Other panelists: ${personas.filter((p) => p.id !== persona.id).map((p) => `${p.name} (${p.role})`).join(", ")}.

Rules:
- Stay completely in character. Speak in first person as ${persona.name}.
- Respond in 2-4 sentences. Conversational, natural spoken English.
- React directly to what the previous speaker said when relevant.
- Push your viewpoint, but be respectful. You may disagree, ask questions, or build on others' points.
- Do NOT prefix your message with your name or role. Just say what you'd say.
- Do NOT use markdown formatting.`;
    } else {
      throw new Error(`Unknown speaker: ${nextSpeakerId}`);
    }

    const transcriptText = history
      .map((t) => `${t.speakerName}: ${t.text}`)
      .join("\n");

    const userContent = transcriptText
      ? `Discussion so far:\n\n${transcriptText}\n\nNow it's your turn. Speak as ${
          isModerator ? "the Moderator" : persona!.name
        }.`
      : openingPrompt
      ? `Use this as inspiration for your opening: "${openingPrompt}". Now speak.`
      : `Begin the discussion now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429)
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (status === 402)
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("discussion-turn error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
