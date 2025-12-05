// api/validateReview.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const token =
      req.headers.authorization?.replace("Bearer ", "").trim() || null;

    if (!token)
      return res.status(401).json({ error: "Missing Authorization Token" });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

    // ⭐ VERIFY TOKEN
    const verify = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!verify.ok)
      return res.status(401).json({ error: "Invalid or expired token" });

    const user = await verify.json();
    const user_id = user.id;

    // ⭐ READ BODY
    const { title, body, lat, lon, rating } = req.body;

    if (!title)
      return res.status(400).json({ error: "Title is required" });

    const safeRating = rating ? parseInt(rating) : null;
    if (safeRating && (safeRating < 1 || safeRating > 5))
      return res.status(400).json({ error: "Invalid rating" });

    // ⭐ INSERT REVIEW
    const insertBody = {
      user_id,
      title,
      body,
      lat: lat || null,
      lon: lon || null,
      rating: safeRating,
      approved: false,
    };

    const r = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(insertBody),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: "Insert failed", details: text });
    }

    const data = await r.json();
    return res.status(200).json({ inserted: data[0] });
  } catch (err) {
    console.error("validateReview error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
}
