// api/adminDeleteReview.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-secret");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  const providedSecret = req.headers["x-admin-secret"];

  if (!ADMIN_SECRET || providedSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing review ID" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/reviews?id=eq.${id}`,
      {
        method: "DELETE",
        headers: {
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
          Prefer: "return=representation",
        },
      }
    );

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: "Delete failed", details: text });
    }

    const data = await r.json();
    return res.status(200).json({ deleted: data });
  } catch (err) {
    console.error("adminDeleteReview error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
}
