import { searchByName } from "../../lib/airtable";

export default async function handler(req, res) {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ error: "Requête trop courte" });
  try {
    const toys = await searchByName(q);
    res.status(200).json(toys);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
}
