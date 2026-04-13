export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Code manquant" });

  try {
    const urls = [
      `https://world.openfoodfacts.org/api/v2/product/${code}.json`,
      `https://world.openproductsfacts.org/api/v2/product/${code}.json`,
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, {
          headers: { "User-Agent": "SafeToys/1.0 (contact@safetoys.fr)" },
          signal: AbortSignal.timeout(5000),
        });
        const data = await r.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          return res.status(200).json({
            found: true,
            barcode: code,
            name: p.product_name_fr || p.product_name || "",
            brand: p.brands || "",
            category: p.categories_tags?.[0]?.replace("en:", "").replace(/-/g, " ") || "",
            imageUrl: p.image_url || p.image_front_url || "",
            quantity: p.quantity || "",
          });
        }
      } catch (_) {}
    }

    return res.status(404).json({ found: false });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur", found: false });
  }
}
