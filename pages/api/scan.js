import { searchByBarcode } from "../../lib/airtable";

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Code manquant" });
  try {
    const toy = await searchByBarcode(code);
    if (toy) {
      res.status(200).json(toy);
    } else {
      res.status(404).json({ error: "Jouet non trouvé" });
    }
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
}
