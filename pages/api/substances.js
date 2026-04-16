// pages/api/substances.js
// Interroge ECHA (Agence Européenne des Produits Chimiques)
// et la liste REACH des substances préoccupantes (SVHC)

export default async function handler(req, res) {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Nom de substance manquant" });

  const query = name.toLowerCase().trim();

  // Base SVHC REACH — substances extrêmement préoccupantes
  // Source officielle : https://echa.europa.eu/candidate-list-table
  const svhcMatches = SVHC_LIST.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.aliases.some(a => a.toLowerCase().includes(query))
  );

  // Base PFAS — liste ECHA
  const pfasMatches = PFAS_LIST.filter(s =>
    s.name.toLowerCase().includes(query) ||
    (s.cas && s.cas.includes(query))
  );

  const results = [
    ...svhcMatches.map(s => ({ ...s, source: "REACH/SVHC", sourceUrl: "https://echa.europa.eu/candidate-list-table" })),
    ...pfasMatches.map(s => ({ ...s, source: "ECHA/PFAS", sourceUrl: "https://echa.europa.eu/pfas" })),
  ];

  return res.status(200).json({
    query,
    found: results.length > 0,
    results,
    echaUrl: `https://echa.europa.eu/search-for-chemicals?p_p_id=disscomp_WAR_disscompportlet&_disscomp_WAR_disscompportlet_searchop=contains&_disscomp_WAR_disscompportlet_searchterm=${encodeURIComponent(name)}`,
  });
}

// Substances SVHC (Candidate List REACH) — extrait des substances liées aux jouets
const SVHC_LIST = [
  { name: "Bis(2-éthylhexyl) phtalate (DEHP)", aliases: ["DEHP","phtalate DEHP"], danger: "Perturbateur endocrinien, toxique pour la reproduction", limit: "0,1% (EN 71-9)", category: "Phtalate" },
  { name: "Dibutyl phtalate (DBP)", aliases: ["DBP","phtalate DBP"], danger: "Perturbateur endocrinien, toxique pour la reproduction", limit: "0,1%", category: "Phtalate" },
  { name: "Benzyl butyl phtalate (BBP)", aliases: ["BBP"], danger: "Perturbateur endocrinien", limit: "0,1%", category: "Phtalate" },
  { name: "Diisobutyl phtalate (DIBP)", aliases: ["DIBP"], danger: "Toxique pour la reproduction", limit: "0,1%", category: "Phtalate" },
  { name: "Bisphénol A (BPA)", aliases: ["BPA","bisphenol A"], danger: "Perturbateur endocrinien, migration possible", limit: "0,04 mg/l (migration)", category: "Phénol" },
  { name: "Formaldéhyde", aliases: ["formaldehyde","aldéhyde formique"], danger: "Cancérigène catégorie 1B, allergisant", limit: "0,1% dans les mélanges", category: "Aldéhyde" },
  { name: "Plomb (composés)", aliases: ["plomb","lead","Pb"], danger: "Neurotoxique, toxique pour la reproduction", limit: "0,5 mg/kg (jouets)", category: "Métal lourd" },
  { name: "Cadmium (composés)", aliases: ["cadmium","Cd"], danger: "Cancérigène, toxique pour les reins", limit: "1,9 mg/kg", category: "Métal lourd" },
  { name: "Chrome VI", aliases: ["chrome hexavalent","chromium VI","Cr VI"], danger: "Cancérigène, allergisant fort", limit: "0,02 mg/kg", category: "Métal lourd" },
  { name: "Nickel", aliases: ["nickel","Ni"], danger: "Allergisant cutané", limit: "0,5 μg/cm²/semaine", category: "Métal" },
  { name: "Arsenic", aliases: ["arsenic","As"], danger: "Cancérigène de catégorie 1", limit: "3,8 mg/kg", category: "Métal lourd" },
  { name: "Bore / Acide borique (Borax)", aliases: ["borax","borate","acide borique","bore"], danger: "Toxique pour la reproduction, irritant", limit: "300 mg/kg (EN 71-3)", category: "Bore" },
  { name: "Colorants azoïques", aliases: ["azoïque","azo dye","amines aromatiques"], danger: "Cancérigènes potentiels (libèrent des amines)", limit: "30 mg/kg par amine", category: "Colorant" },
  { name: "Retardateurs de flamme bromés (PBDE)", aliases: ["PBDE","retardateur flamme","flame retardant","bromine"], danger: "Perturbateur endocrinien, persistant", limit: "Interdit (REACH)", category: "Retardateur flamme" },
];

// Extrait de la liste PFAS ECHA (substances per- et polyfluoroalkylées)
const PFAS_LIST = [
  { name: "PFOS (acide perfluorooctanesulfonique)", cas: "1763-23-1", danger: "Persistant, bioaccumulable, perturbateur endocrinien", limit: "Interdit (REACH Annexe XVII)", category: "PFAS" },
  { name: "PFOA (acide perfluorooctanoïque)", cas: "335-67-1", danger: "Cancérigène, persistant, perturbateur endocrinien", limit: "Interdit (REACH)", category: "PFAS" },
  { name: "PFAS génériques (composés fluorés)", cas: "", danger: "Famille de 10 000+ substances, dont beaucoup sont persistantes et toxiques", limit: "Restriction en cours (2026)", category: "PFAS" },
  { name: "PFHxS (acide perfluorohexanesulfonique)", cas: "355-46-4", danger: "Persistant, toxique pour la thyroïde", limit: "Interdit (REACH 2023)", category: "PFAS" },
];
