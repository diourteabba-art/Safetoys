const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;
const TABLE = encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "Table 1");
const HEADERS = {
  Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

export async function searchByBarcode(barcode) {
  const formula = encodeURIComponent(`{Code-barres (EAN)} = "${barcode}"`);
  const res = await fetch(`${BASE_URL}/${TABLE}?filterByFormula=${formula}`, { headers: HEADERS });
  const data = await res.json();
  if (data.records && data.records.length > 0) {
    return formatRecord(data.records[0]);
  }
  return null;
}

export async function searchByName(query) {
  const formula = encodeURIComponent(`SEARCH(LOWER("${query}"), LOWER({Nom du jouet}))`);
  const res = await fetch(`${BASE_URL}/${TABLE}?filterByFormula=${formula}&maxRecords=10`, { headers: HEADERS });
  const data = await res.json();
  if (data.records) {
    return data.records.map(formatRecord);
  }
  return [];
}

export async function submitToy(fields) {
  const res = await fetch(`${BASE_URL}/${TABLE}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      records: [{
        fields: {
          "Nom du jouet": fields.name,
          "Marque": fields.brand,
          "Catégorie": fields.category,
          "Tranche d'âge": fields.age,
          "Code-barres (EAN)": fields.barcode || "",
          "Statut": "En attente",
          "Source / Justification": `Soumis par la communauté - ${fields.comment || ""}`,
        }
      }]
    }),
  });
  return res.ok;
}

function formatRecord(record) {
  const f = record.fields;
  return {
    id: record.id,
    name: f["Nom du jouet"] || "",
    barcode: f["Code-barres (EAN)"] || "",
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
  };
}
