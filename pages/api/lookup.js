export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Code manquant" });

  const SUBSTANCES_DANGER = [
    "pfas","perfluor","phtalate","phthalate","dehp","dbp","bbp","dinp","didp",
    "bpa","bisphénol","bisphenol","plomb","lead","cadmium","chrome","chromium",
    "nickel","formaldéhyde","formaldehyde","azoïque","azo dye","borax","borate",
    "retardateur","flame retardant","pbde","pcb","styrène","styrene",
    "pvc","chlorure de vinyle","vinyl chloride"
  ];

  function analyzeMaterials(materials) {
    if (!materials || !materials.length) return [];
    return materials.map(m => {
      const ml = m.toLowerCase();
      const isDanger = SUBSTANCES_DANGER.some(d => ml.includes(d));
      return { name: m, danger: isDanger };
    });
  }

  try {
    const urls = [
      `https://world.openfoodfacts.org/api/v2/product/${code}.json`,
      `https://world.openproductsfacts.org/api/v2/product/${code}.json`,
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, {
          headers: { "User-Agent": "SafeToys/1.0 (safetoys.vercel.app)" },
          signal: AbortSignal.timeout(6000),
        });
        const data = await r.json();

        if (data.status === 1 && data.product) {
          const p = data.product;

          // Récupérer les matériaux/ingrédients déclarés
          const rawMaterials = [
            ...(p.materials_en ? p.materials_en.split(",") : []),
            ...(p.ingredients_text_fr ? [p.ingredients_text_fr] : []),
            ...(p.packaging_materials_tags || []).map(t => t.replace("en:","").replace(/-/g," ")),
          ].map(m => m.trim()).filter(Boolean);

          const analyzed = analyzeMaterials(rawMaterials);

          return res.status(200).json({
            found: true,
            barcode: code,
            name: p.product_name_fr || p.product_name || p.abbreviated_product_name || "",
            brand: p.brands || "",
            category: p.categories_tags?.[0]?.replace("en:","").replace(/-/g," ") || "",
            imageUrl: p.image_url || p.image_front_url || p.image_front_small_url || "",
            quantity: p.quantity || "",
            materials: rawMaterials,
            analyzedMaterials: analyzed,
            hasDangerousSubstances: analyzed.some(m => m.danger),
            source: "OpenProductsFacts",
          });
        }
      } catch (_) {}
    }

    return res.status(404).json({ found: false });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur", found: false });
  }
}
