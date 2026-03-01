import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { workoutData } = await req.json();

    const systemPrompt = `Tu es un coach sportif expert en cyclisme, course à pied et natation. 
Tu analyses les données d'entraînement et fournis une analyse complète en français.

Structure ta réponse en sections avec des emojis :
1. 📊 **Résumé de la séance** - Vue d'ensemble de l'effort
2. 💪 **Points forts** - Ce qui a bien fonctionné
3. ⚠️ **Axes d'amélioration** - Ce qui pourrait être amélioré
4. 🎯 **Zones d'entraînement** - Analyse de l'intensité et des zones travaillées
5. 💡 **Recommandations** - Conseils pour la prochaine séance

Sois concis mais précis. Utilise les données fournies pour personnaliser l'analyse.
Ne mentionne jamais que tu es une IA.`;

    const userPrompt = `Voici les données de ma séance d'entraînement :

Type d'activité : ${workoutData.type || 'Non spécifié'}
Durée : ${workoutData.duration || 'N/A'}
Distance : ${workoutData.distance || 'N/A'}

Puissance : Moy ${workoutData.avgPower || 'N/A'}W, Min ${workoutData.minPower || 'N/A'}W, Max ${workoutData.maxPower || 'N/A'}W
${workoutData.normalizedPower ? `Puissance normalisée : ${workoutData.normalizedPower}W` : ''}
Cadence : Moy ${workoutData.avgCadence || 'N/A'} rpm, Min ${workoutData.minCadence || 'N/A'} rpm, Max ${workoutData.maxCadence || 'N/A'} rpm
Fréquence cardiaque : Moy ${workoutData.avgHeartRate || 'N/A'} bpm, Min ${workoutData.minHeartRate || 'N/A'} bpm, Max ${workoutData.maxHeartRate || 'N/A'} bpm
Vitesse/Allure : ${workoutData.speedDisplay || 'N/A'}

${workoutData.tss ? `TSS : ${workoutData.tss}` : ''}
${workoutData.lapCount ? `Nombre de tours : ${workoutData.lapCount}` : ''}

Analyse cette séance en détail.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Ajoutez des crédits dans les paramètres." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Aucune analyse disponible.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-workout:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
