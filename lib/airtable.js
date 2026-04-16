// lib/airtable.js
const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;
const TABLE = encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "jouets");
const HEADERS = {
  Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

export async function searchByBarcode(barcode) {
  const formula = encodeURIComponent(`{Code-barres (EAN)} = "${barcode}"`);
  const res = await fetch(`${BASE_URL}/${TABLE}?filterByFormula=${formula}`, { headers: HEADERS });
  const data = await res.json();
  if (data.records && data.records.length > 0) return formatRecord(data.records[0]);
  return null;
}

export async function searchByName(query) {
  const formula = encodeURIComponent(`SEARCH(LOWER("${query}"), LOWER({Nom du jouet}))`);
  const res = await fetch(`${BASE_URL}/${TABLE}?filterByFormula=${formula}&maxRecords=10`, { headers: HEADERS });
  const data = await res.json();
  if (data.records) return data.records.map(formatRecord);
  return [];
}

export async function submitToy(fields) {
  // Construire les champs — seulement ceux qui existent dans Airtable
  const airtableFields = {
    "Nom du jouet": fields.name || "",
    "Marque": fields.brand || "",
    "Statut": "En attente",
    "Source / Justification": `Soumis via communauté${fields.comment ? " — " + fields.comment : ""}`,
  };

  // Champs optionnels — on les ajoute seulement s'ils ont une valeur
  if (fields.category) airtableFields["Catégorie"] = fields.category;
  if (fields.age) airtableFields["Tranche d'âge"] = fields.age;
  if (fields.barcode) airtableFields["Code-barres (EAN)"] = fields.barcode;
  if (fields.imageUrl) airtableFields["Image URL"] = fields.imageUrl;

  const res = await fetch(`${BASE_URL}/${TABLE}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ records: [{ fields: airtableFields }] }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Airtable submit error:", JSON.stringify(err));
    return false;
  }
  return true;
}

export function formatRecord(record) {
  const f = record.fields;
  return {
    id: record.id,
    name: f["Nom du jouet"] || "",
    barcode: String(f["Code-barres (EAN)"] || ""),
    brand: f["Marque"] || "",
    category: f["Catégorie"] || "",
    age: f["Tranche d'âge"] || "",
    score: f["Score"] || "?",
    substances: f["Substances détectées"] || "Non renseigné",
    danger: f["Niveau de danger"] || "Non renseigné",
    link: f["Lien produit"] || "",
    status: f["Statut"] || "",
    alternative: f["Alternative recommandée"] || "",
    source: f["Source / Justification"] || "",
    imageUrl: f["Image URL"] || "",
    scoreECHA: f["Score ECHA"] || "",
  };
}
