import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PERSONA_PACKS: Record<string, string> = {
  balanced:
    "A balanced panel of 3 thoughtful experts with complementary viewpoints (e.g., optimist, pragmatist, cautious analyst).",
  "debate-heavy":
    "3 experts with sharply opposing viewpoints who will challenge each other respectfully but firmly.",
  "devils-advocate":
    "3 experts where at least one is a strong devil's advocate who pushes back on every claim.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category = "Technology", difficulty = "intermediate", personaPack = "balanced" } =
      await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const packDesc = PERSONA_PACKS[personaPack] || PERSONA_PACKS.balanced;

    const systemPrompt = `You generate a group discussion setup. The user gives a category, difficulty and persona pack. Produce:
- A specific, debatable topic relevant to "${category}" suited to ${difficulty} level participants.
- A short opening prompt the moderator will say to kick things off.
- Exactly 3 distinct panelists matching this pack: ${packDesc}

For each panelist provide:
- id: short kebab-case unique id
- name: realistic first + last name
- role: 2-4 word title (e.g., "Tech Optimist", "Cautious Economist")
- viewpoint: one sentence describing their stance on this topic
- voiceHint: one of "male-1", "male-2", "female-1", "female-2" (each panelist must use a different hint)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Category: ${category}\nDifficulty: ${difficulty}\nPersona pack: ${personaPack}`,
          },
        ],
        tool_choice: { type: "function", function: { name: "create_discussion" } },
        tools: [
          {
            type: "function",
            function: {
              name: "create_discussion",
              description: "Return the topic, opening prompt and 3 panelists.",
              parameters: {
                type: "object",
                properties: {
                  topic: { type: "string" },
                  openingPrompt: { type: "string" },
                  personas: {
                    type: "array",
                    minItems: 3,
                    maxItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        role: { type: "string" },
                        viewpoint: { type: "string" },
                        voiceHint: {
                          type: "string",
                          enum: ["male-1", "male-2", "female-1", "female-2"],
                        },
                      },
                      required: ["id", "name", "role", "viewpoint", "voiceHint"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["topic", "openingPrompt", "personas"],
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
    console.error("discussion-topic error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
