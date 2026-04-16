// pages/api/submit.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { name, brand, category, age, barcode, comment, imageUrl } = req.body;
  if (!name || !brand) return res.status(400).json({ error: "Nom et marque obligatoires" });

  const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "jouets")}`;
  const HEADERS = {
    Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
    "Content-Type": "application/json",
  };

  const fields = {
    "Nom du jouet": String(name).substring(0, 255),
    "Marque": String(brand).substring(0, 255),
    "Source / Justification": `Communauté${comment ? " — " + String(comment).substring(0, 400) : ""}${barcode ? " | Code: " + barcode : ""}`,
  };

  if (category && category.trim()) fields["Catégorie"] = String(category);
  if (age && age.trim()) fields["Tranche d'âge"] = String(age);
  if (imageUrl && imageUrl.startsWith("http")) fields["Image URL"] = String(imageUrl);

  // ⚠️ On n'envoie plus "Statut" ici pour éviter l'erreur de permission
  // Ajoute manuellement les options dans Airtable si tu veux le statut

  try {
    const airtableRes = await fetch(BASE_URL, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ records: [{ fields }] }),
    });

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      console.error("Airtable error:", JSON.stringify(data));
      return res.status(500).json({
        error: "Erreur Airtable",
        detail: data?.error?.message || JSON.stringify(data),
      });
    }

    return res.status(200).json({ success: true, id: data.records?.[0]?.id });
  } catch (e) {
    console.error("Submit exception:", e.message);
    return res.status(500).json({ error: "Erreur serveur", detail: e.message });
  }
}
