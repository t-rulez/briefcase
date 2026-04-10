export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { wineName } = req.body;
  if (!wineName) return res.status(400).json({ error: "wineName påkrevd" });

  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (!claudeKey) return res.status(500).json({ error: "Mangler ANTHROPIC_API_KEY" });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": claudeKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 1,
      thinking: { type: "disabled" },
      messages: [{
        role: "user",
        content: [{
          type: "text",
          text: `You will be providing an overview of a wine in Norwegian. The wine you need to describe is:\n\n<wine_name>\n${wineName}\n</wine_name>\n\nPlease provide a brief overview of this wine that includes:\n\n1. Taste profile (smaksprofil): Describe the wine's characteristics including color, aroma, flavor notes, body, acidity, and any other relevant tasting notes.\n\n2. Food pairings (matanbefalinger): Suggest what types of food, dishes, or cuisines pair well with this wine and explain why these pairings work.\n\n3. Alternative wines, within the same category and tastings. 1 cheaper alternative, 1 alternative with approximately the same price, and a third alternative which is a bit more expensive.\n\nYour entire response must be written in Norwegian. Do not use # or * in the text. But use icons for the food suggestion, and also use green, yellow and red balls for the alternative wine suggestions (green = cheaper, yellow=about same price, red=more expensive)\n\n`,
        }],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return res.status(500).json({ error: `Claude feil: ${response.status}`, detail: err.substring(0, 200) });
  }

  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  return res.status(200).json({ analysis: text });
}
