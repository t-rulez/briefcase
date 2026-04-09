import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT * FROM cigars ORDER BY id ASC`;

  const cigars = rows.map(c => ({
    ...c,
    ring: Number(c.ring),
    price: Number(c.price),
    rating: Number(c.rating),
    flavors: JSON.parse(c.flavors),
  }));

  return res.status(200).json(cigars);
}
