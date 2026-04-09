import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, config } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an interview performance analyst. Analyze the following interview conversation and provide detailed feedback. Consider the interview was for a ${config?.role || "developer"} position, ${config?.type || "technical"} type, ${config?.difficulty || "intermediate"} difficulty.`,
          },
          {
            role: "user",
            content: `Analyze this interview conversation and provide feedback:\n\n${conversationText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_feedback",
              description: "Provide structured interview feedback with scores and tips",
              parameters: {
                type: "object",
                properties: {
                  overall: {
                    type: "number",
                    description: "Overall score from 0-100",
                  },
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        score: { type: "number", description: "Score 0-100" },
                      },
                      required: ["name", "score"],
                      additionalProperties: false,
                    },
                    description: "Scores for: Communication, Technical Knowledge, Problem Solving, Confidence",
                  },
                  tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 actionable improvement tips",
                  },
                  summary: {
                    type: "string",
                    description: "A brief 2-3 sentence overall assessment",
                  },
                },
                required: ["overall", "categories", "tips", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_feedback" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI feedback error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to generate feedback" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No feedback generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const feedback = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interview-feedback error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
