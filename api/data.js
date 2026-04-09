import { neon } from "@neondatabase/serverless";

// Felles brukerdata for alle Briefcase-apper
// app=wine  → vb_userdata  (tastings + cellar)
// app=cigar → cigar_userdata (experiences + stock)
// app=spice → sb_userdata  (notes + pantry)

const CONFIGS = {
  wine: {
    table:  "vb_userdata",
    fields: ["tastings", "cellar"],
    defaults: { tastings: "[]", cellar: "[]" },
  },
  cigar: {
    table:  "cigar_userdata",
    fields: ["experiences", "stock"],
    defaults: { experiences: "[]", stock: "{}" },
  },
  spice: {
    table:  "sb_userdata",
    fields: ["notes", "pantry"],
    defaults: { notes: "[]", pantry: "{}" },
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);
  const app = (req.method === "GET" ? req.query.app : req.body?.app) || "wine";
  const username = req.method === "GET" ? req.query.username : req.body?.username;
  if (!username) return res.status(400).json({ error: "Missing username" });

  const cfg = CONFIGS[app] || CONFIGS.wine;
  const [f1, f2] = cfg.fields;

  await sql.query(`CREATE TABLE IF NOT EXISTS ${cfg.table} (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    ${f1} TEXT DEFAULT '${cfg.defaults[f1]}',
    ${f2} TEXT DEFAULT '${cfg.defaults[f2]}'
  )`);

  if (req.method === "GET") {
    const rows = await sql.query(
      `SELECT ${f1}, ${f2} FROM ${cfg.table} WHERE username = $1`,
      [username]
    );
    if (rows.rows.length === 0)
      return res.status(200).json({ [f1]: JSON.parse(cfg.defaults[f1]), [f2]: JSON.parse(cfg.defaults[f2]) });
    return res.status(200).json({
      [f1]: JSON.parse(rows.rows[0][f1]),
      [f2]: JSON.parse(rows.rows[0][f2]),
    });
  }

  if (req.method === "POST") {
    const v1 = JSON.stringify(req.body[f1] ?? JSON.parse(cfg.defaults[f1]));
    const v2 = JSON.stringify(req.body[f2] ?? JSON.parse(cfg.defaults[f2]));
    await sql.query(
      `INSERT INTO ${cfg.table} (username, ${f1}, ${f2})
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE SET ${f1} = $2, ${f2} = $3`,
      [username, v1, v2]
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
