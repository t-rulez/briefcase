import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

// Felles auth for alle Briefcase-apper
// Bruker separat tabell per app: vb_users, cigar_users, sb_users
const TABLES = {
  wine:  "vb_users",
  cigar: "cigar_users",
  spice: "sb_users",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { action, username, password, app = "wine" } = req.body;
  if (!action || !username || !password)
    return res.status(400).json({ error: "Missing fields" });

  const table = TABLES[app] || TABLES.wine;
  const sql = neon(process.env.DATABASE_URL);
  const user = username.trim().toLowerCase();

  await sql.query(`CREATE TABLE IF NOT EXISTS ${table} (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  if (action === "register") {
    const existing = await sql.query(`SELECT id FROM ${table} WHERE username = $1`, [user]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: "Brukernavnet er allerede tatt." });
    const hash = await bcrypt.hash(password, 10);
    await sql.query(`INSERT INTO ${table} (username, password) VALUES ($1, $2)`, [user, hash]);
    return res.status(200).json({ ok: true, username: user });
  }

  if (action === "login") {
    const rows = await sql.query(`SELECT username, password FROM ${table} WHERE username = $1`, [user]);
    if (rows.rows.length === 0)
      return res.status(401).json({ error: "Feil brukernavn eller passord." });
    const match = await bcrypt.compare(password, rows.rows[0].password);
    if (!match)
      return res.status(401).json({ error: "Feil brukernavn eller passord." });
    return res.status(200).json({ ok: true, username: rows.rows[0].username });
  }

  return res.status(400).json({ error: "Unknown action" });
}
