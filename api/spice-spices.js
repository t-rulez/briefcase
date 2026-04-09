import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT * FROM sb_spices ORDER BY id ASC`;

  const spices = rows.map(s => ({
    ...s,
    uses: s.uses ? JSON.parse(s.uses) : [],
    pairings: s.pairings ? JSON.parse(s.pairings) : [],
  }));

  return res.status(200).json(spices);
}
