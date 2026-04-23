import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Turn {
  speakerId: string;
  speakerName: string;
  text: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, history } = await req.json() as { topic: string; history: Turn[] };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userTurns = history.filter((t) => t.speakerId === "user");
    const transcript = history.map((t) => `${t.speakerName}: ${t.text}`).join("\n");

    const systemPrompt = `You are a friendly group-discussion coach. Review the transcript of a panel discussion and give the USER (only the participant labeled "You") brief, encouraging, actionable feedback. If the user did not speak, gently note that and suggest jumping in next time.

Output:
- summary: 2-3 sentence overview of how the user contributed.
- strengths: 2-3 short bullet points (max ~12 words each).
- improvements: 2-3 short bullet points (max ~12 words each).

Keep it positive but honest. No scoring.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Topic: ${topic}\n\nUser spoke ${userTurns.length} time(s).\n\nFull transcript:\n${transcript}`,
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_summary" } },
        tools: [
          {
            type: "function",
            function: {
              name: "provide_summary",
              description: "Return user-focused discussion feedback.",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  strengths: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 2,
                    maxItems: 3,
                  },
                },
                required: ["summary", "strengths", "improvements"],
                additionalProperties: false,
              },
            },
          },
        ],
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

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No tool_call returned");
    const parsed = JSON.parse(args);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("discussion-summary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
