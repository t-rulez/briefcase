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
          text: `You will be providing an overview of a wine in Norwegian. The wine you need to describe is:\n\n<wine_name>\n${wineName}\n</wine_name>\n\nPlease provide the following in Norwegian:\n\n1. Smaksprofil: Beskriv vinens karakteristikk inkludert farge, aroma, smaksnoter, fylde, syre og andre relevante smaksegenskaper.\n\n2. Matanbefalinger: Foreslå hvilke typer mat, retter eller kjøkken som passer godt til denne vinen og forklar hvorfor disse kombinasjonene fungerer. Bruk matikoner.\n\n3. Alternativer innen samme kategori og smaksprofil. Gi 3 alternativer:\n   🟢 Billigere alternativ: [navn] - ca. [pris] kr - [kort smaksbeskrivelse] - Søk på Vinmonopolet: https://www.vinmonopolet.no/search?q=[URL-kodet vinnamn]&searchType=product\n   🟡 Tilsvarende pris: [navn] - ca. [pris] kr - [kort smaksbeskrivelse] - Søk på Vinmonopolet: https://www.vinmonopolet.no/search?q=[URL-kodet vinnamn]&searchType=product\n   🔴 Dyrere alternativ: [navn] - ca. [pris] kr - [kort smaksbeskrivelse] - Søk på Vinmonopolet: https://www.vinmonopolet.no/search?q=[URL-kodet vinnamn]&searchType=product\n\nSkriv hele svaret på norsk. Ikke bruk # eller * i teksten.\n\n`,
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
