// app/api/route/route.js
export async function GET() {
  return Response.json({
    ok: true,
    message: "Proxy LegiMedTravQ opérationnel ✅",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  return Response.json({
    received: true,
    prompt: body.prompt || "(aucun prompt)",
    message: "Requête POST reçue avec succès"
  });
}