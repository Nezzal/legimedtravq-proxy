// app/api/route.js

export async function GET() {
  return Response.json({
    ok: true,
    message: "Proxy LegiMedTravQ opérationnel ✅",
    hasKey: !!process.env.OPENROUTER_API_KEY,
    timestamp: new Date().toISOString()
  });
}
export async function POST(request) {
  // ⚠️ Pour la conférence : ajoute un petit délai si besoin (éviter le spam)
  // await new Promise(resolve => setTimeout(resolve, 200));

  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Veuillez poser une question sur la SST (ex: "Quels sont les EPI obligatoires ?")' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Appel à OpenRouter — Qwen3-Max
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://legimedtravq.vercel.app', // requis par OpenRouter
        'X-Title': 'LegiMedTravQ - Conférence SST Algérie'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-max',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en Santé et Sécurité au Travail (SST) en Algérie. Réponds de façon claire, concise et professionnelle. Cite les textes de loi si possible (ex: Décret exécutif 14-235).'
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    const data = await response.json();

    // Journalisation discrète (visible dans Vercel Logs)
    console.log(`[Qwen3-Max] Prompt: "${prompt.slice(0, 30)}..." → Status: ${response.status}`);

    if (!response.ok) {
      const errorMsg = data.error?.message || 'Erreur inconnue';
      return new Response(JSON.stringify({
        error: `Service temporairement indisponible`,
        details: process.env.NODE_ENV === 'development' ? errorMsg : undefined
      }), { status: 503 });
    }

    const reponse = data.choices?.[0]?.message?.content?.trim() 
      || 'Désolé, je n’ai pas pu générer une réponse. Veuillez reformuler.';

    return new Response(JSON.stringify({ reponse }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Erreur serveur:', err);
    return new Response(JSON.stringify({ 
      error: 'Erreur interne — veuillez réessayer dans quelques secondes.'
    }), { status: 500 });
  }
}