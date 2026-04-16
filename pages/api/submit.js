// pages/api/submit.js
// Soumission avec notation automatique partielle :
// 1. Matériaux Open Products Facts → analyse ECHA/REACH
// 2. Vérification alerte RAPEX par nom/marque
// 3. Score provisoire calculé automatiquement

// ─── BASE SUBSTANCES ECHA/REACH/SVHC ────────────────────────
const DANGER_ELEVE = [
  "pfas","perfluor","pfos","pfoa","pfhxs",
  "dehp","phtalate dehp","phtalate dbp","dbp","bbp","dibp",
  "plomb","lead","cadmium","chrome vi","arsenic",
  "azoïque","azo","amines aromatiques",
  "retardateur flamme","pbde","flame retardant",
  "borax","acide borique","borate",
  "formaldéhyde","formaldehyde",
  "bpa","bisphénol","bisphenol",
];

const DANGER_MODERE = [
  "dinp","didp","phtalate",
  "nickel","antimoine","baryum","sélénium",
  "colorant azoïque","colorant synthétique",
  "conservateur","mit","cmit","methylisothiazolinone",
  "plastifiant","pvc","chlorure de vinyle",
  "retardateur","bromé","bromine",
];

// Matériaux naturellement sûrs → bonus score A
const MATIERES_SURES = [
  "bois","wood","coton","cotton","laine","wool",
  "caoutchouc naturel","natural rubber","bambou","bamboo",
  "bio","organic","certifié","certified","oeko-tex","fsc","pefc",
];

function analyserTexte(texte) {
  if (!texte) return null;
  const t = texte.toLowerCase();

  const dangerEleveFound = DANGER_ELEVE.filter(s => t.includes(s));
  const dangerModereFound = DANGER_MODERE.filter(s => t.includes(s));
  const suresFound = MATIERES_SURES.filter(s => t.includes(s));

  if (dangerEleveFound.length > 0) {
    return {
      score: "D",
      niveau: "Élevé",
      substances: dangerEleveFound.map(s => s.toUpperCase()).join(", "),
      explication: `Substances SVHC/REACH détectées : ${dangerEleveFound.slice(0,3).join(", ")}`,
    };
  }
  if (dangerModereFound.length > 0) {
    return {
      score: "C",
      niveau: "Modéré",
      substances: dangerModereFound.map(s => s).join(", "),
      explication: `Substances préoccupantes : ${dangerModereFound.slice(0,3).join(", ")}`,
    };
  }
  if (suresFound.length >= 2) {
    return {
      score: "A",
      niveau: "Faible",
      substances: "Aucune substance préoccupante détectée",
      explication: `Matériaux naturels/certifiés : ${suresFound.join(", ")}`,
    };
  }
  return null; // Pas assez d'info pour noter
}

async function verifierRAPEX(name, brand) {
  try {
    const keyword = `${name} ${brand}`.trim();
    const url = `https://ec.europa.eu/safety-gate-alerts/screen/webApi/public/alerts?lang=fr&offset=0&limit=5&keyword=${encodeURIComponent(keyword)}&category=Jouets`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.alerts?.length > 0) {
      return {
        alerte: true,
        detail: data.alerts[0].description || "Produit signalé sur Safety Gate EU",
        reference: data.alerts[0].reference || "",
      };
    }
  } catch (_) {}
  return null;
}

async function enrichirDepuisOFF(barcode) {
  if (!barcode) return null;
  try {
    const urls = [
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      `https://world.openproductsfacts.org/api/v2/product/${barcode}.json`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "SafeToys/1.0" },
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          // Concaténer tous les textes disponibles pour analyse
          const texteAnalyse = [
            p.ingredients_text_fr,
            p.ingredients_text,
            p.packaging_text_fr,
            p.packaging_text,
            p.materials_en,
            (p.packaging_materials_tags || []).join(" "),
            (p.labels_tags || []).join(" "),
            p.generic_name_fr,
          ].filter(Boolean).join(" ");

          return {
            imageUrl: p.image_url || p.image_front_url || "",
            texteAnalyse,
            labels: (p.labels_tags || []).join(", "),
          };
        }
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { name, brand, category, age, barcode, comment, imageUrl, materials } = req.body;
  if (!name || !brand) return res.status(400).json({ error: "Nom et marque obligatoires" });

  const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "jouets")}`;
  const HEADERS = {
    Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
    "Content-Type": "application/json",
  };

  // ─── ÉTAPE 1 : Enrichissement Open Products Facts ────────────
  let offData = null;
  if (barcode) offData = await enrichirDepuisOFF(barcode);

  // ─── ÉTAPE 2 : Analyse substances ───────────────────────────
  const texteTotal = [
    comment || "",
    materials ? (Array.isArray(materials) ? materials.join(" ") : materials) : "",
    offData?.texteAnalyse || "",
    offData?.labels || "",
    name, brand,
  ].join(" ");

  let analyse = analyserTexte(texteTotal);

  // ─── ÉTAPE 3 : Vérification RAPEX ───────────────────────────
  const rapex = await verifierRAPEX(name, brand);
  if (rapex?.alerte && (!analyse || analyse.score !== "D")) {
    analyse = {
      score: "D",
      niveau: "Élevé",
      substances: "Alerte Safety Gate EU",
      explication: `⚠️ Signalé sur Safety Gate EU : ${rapex.detail.substring(0, 100)}`,
    };
  }

  // ─── ÉTAPE 4 : Score par défaut si pas d'info suffisante ────
  if (!analyse) {
    analyse = {
      score: "?",
      niveau: "Inconnu",
      substances: "Composition non renseignée — analyse en attente",
      explication: "Insuffisamment d'informations pour noter automatiquement",
    };
  }

  const isProvisoire = !rapex?.alerte && texteTotal.length < 50;

  // ─── ÉTAPE 5 : Construction des champs Airtable ─────────────
  const fields = {
    "Nom du jouet": String(name).substring(0, 255),
    "Marque": String(brand).substring(0, 255),
    "Substances détectées": analyse.substances,
    "Niveau de danger": analyse.niveau !== "Inconnu" ? analyse.niveau : "Non évalué",
    "Source / Justification": [
      "Soumis via communauté SafeToys",
      analyse.explication,
      rapex ? `Alerte RAPEX : ${rapex.reference}` : "",
      comment || "",
      barcode ? `Code: ${barcode}` : "",
    ].filter(Boolean).join(" | ").substring(0, 900),
  };

  // Score — uniquement si on a pu calculer A/B/C/D
  if (["A","B","C","D"].includes(analyse.score)) {
    fields["Score"] = analyse.score;
    fields["Score ECHA"] = isProvisoire
      ? `${analyse.score} (provisoire) — ${analyse.explication.substring(0, 100)}`
      : `${analyse.score} — ${analyse.explication.substring(0, 100)}`;
  }

  if (category?.trim()) fields["Catégorie"] = String(category);
  if (age?.trim()) fields["Tranche d'âge"] = String(age);

  // Image : priorité à celle d'Open Products Facts
  const finalImage = (offData?.imageUrl && offData.imageUrl.startsWith("http"))
    ? offData.imageUrl
    : (imageUrl && imageUrl.startsWith("http") ? imageUrl : null);
  if (finalImage) fields["Image URL"] = finalImage;

  // ─── ÉTAPE 6 : Envoi Airtable ────────────────────────────────
  try {
    const airtableRes = await fetch(BASE_URL, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ records: [{ fields }] }),
    });

    const data = await airtableRes.json();
    if (!airtableRes.ok) {
      console.error("Airtable error:", JSON.stringify(data));
      return res.status(500).json({ error: "Erreur Airtable", detail: data?.error?.message });
    }

    return res.status(200).json({
      success: true,
      id: data.records?.[0]?.id,
      score: analyse.score,
      scoreProvisoire: isProvisoire,
      explication: analyse.explication,
      rapexAlerte: !!rapex?.alerte,
    });
  } catch (e) {
    console.error("Submit exception:", e.message);
    return res.status(500).json({ error: "Erreur serveur", detail: e.message });
  }
}
