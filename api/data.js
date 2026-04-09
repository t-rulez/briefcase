import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);
  const app = (req.method === "GET" ? req.query.app : req.body?.app) || "wine";
  const username = req.method === "GET" ? req.query.username : req.body?.username;
  if (!username) return res.status(400).json({ error: "Missing username" });

  // Opprett alle tabeller
  await sql`CREATE TABLE IF NOT EXISTS vb_userdata (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, tastings TEXT DEFAULT '[]', cellar TEXT DEFAULT '[]')`;
  await sql`CREATE TABLE IF NOT EXISTS cigar_userdata (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, experiences TEXT DEFAULT '[]', stock TEXT DEFAULT '{}')`;
  await sql`CREATE TABLE IF NOT EXISTS sb_userdata (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, notes TEXT DEFAULT '[]', pantry TEXT DEFAULT '{}')`;

  if (req.method === "GET") {
    if (app === "cigar") {
      const rows = await sql`SELECT experiences, stock FROM cigar_userdata WHERE username = ${username}`;
      if (rows.length === 0) return res.status(200).json({ experiences: [], stock: {} });
      return res.status(200).json({ experiences: JSON.parse(rows[0].experiences), stock: JSON.parse(rows[0].stock) });
    }
    if (app === "spice") {
      const rows = await sql`SELECT notes, pantry FROM sb_userdata WHERE username = ${username}`;
      if (rows.length === 0) return res.status(200).json({ notes: [], pantry: {} });
      return res.status(200).json({ notes: JSON.parse(rows[0].notes), pantry: JSON.parse(rows[0].pantry) });
    }
    // wine
    const rows = await sql`SELECT tastings, cellar FROM vb_userdata WHERE username = ${username}`;
    if (rows.length === 0) return res.status(200).json({ tastings: [], cellar: [] });
    return res.status(200).json({ tastings: JSON.parse(rows[0].tastings), cellar: JSON.parse(rows[0].cellar) });
  }

  if (req.method === "POST") {
    if (app === "cigar") {
      const e = JSON.stringify(req.body.experiences ?? []);
      const s = JSON.stringify(req.body.stock ?? {});
      await sql`INSERT INTO cigar_userdata (username, experiences, stock) VALUES (${username}, ${e}, ${s}) ON CONFLICT (username) DO UPDATE SET experiences = ${e}, stock = ${s}`;
      return res.status(200).json({ ok: true });
    }
    if (app === "spice") {
      const n = JSON.stringify(req.body.notes ?? []);
      const p = JSON.stringify(req.body.pantry ?? {});
      await sql`INSERT INTO sb_userdata (username, notes, pantry) VALUES (${username}, ${n}, ${p}) ON CONFLICT (username) DO UPDATE SET notes = ${n}, pantry = ${p}`;
      return res.status(200).json({ ok: true });
    }
    // wine
    const t = JSON.stringify(req.body.tastings ?? []);
    const c = JSON.stringify(req.body.cellar ?? []);
    await sql`INSERT INTO vb_userdata (username, tastings, cellar) VALUES (${username}, ${t}, ${c}) ON CONFLICT (username) DO UPDATE SET tastings = ${t}, cellar = ${c}`;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
