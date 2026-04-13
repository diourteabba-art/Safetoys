import { submitToy } from "../../lib/airtable";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  const { name, brand, category, age, barcode, comment } = req.body;
  if (!name || !brand) return res.status(400).json({ error: "Nom et marque obligatoires" });
  try {
    const ok = await submitToy({ name, brand, category, age, barcode, comment });
    if (ok) res.status(200).json({ success: true });
    else res.status(500).json({ error: "Erreur lors de la soumission" });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
}
