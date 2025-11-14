// app/api/route/route.js
export const runtime = 'edge';

export async function GET() {
  return Response.json({
    ok: true,
    message: "Proxy LegiMedTravQ opérationnel ✅",
    hasKey: !!process.env.OPENROUTER_API_KEY,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return Response.json(
        { error: "Veuillez fournir un prompt valide." },
        { status: 400 }
      );
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://legimedtravq.vercel.app',
        'X-Title': 'LegiMedTravQ - SST Algérie'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-max', // ou 'openai/gpt-4o-mini' pour test
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en SST en Algérie. Réponds concisément, avec rigueur juridique (citer les textes si possible).'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 600
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[OpenRouter] Error:', response.status, data);
      return Response.json(
        { error: "Service temporairement indisponible.", debug: process.env.NODE_ENV === 'development' ? data : undefined },
        { status: 503 }
      );
    }

    return Response.json({
      reponse: data.choices?.[0]?.message?.content?.trim() || 'Aucune réponse générée.'
    });

  } catch (err) {
    console.error('[Proxy Error]:', err);
    return Response.json({ error: "Erreur interne." }, { status: 500 });
  }
}