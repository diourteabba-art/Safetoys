import { useRef, useState } from "react";
import { useRouter } from "next/router";
import BottomNav from "../components/BottomNav";

const CATEGORIES = ["Peluche","Jeu de construction","Jeu de société","Véhicule","Art créatif","Jeu d'éveil","Puzzle","Instrument musique","Jeu plein air","Jeu électronique","Déguisement","Jeu de rôle","Science éducatif","Loisirs créatifs","Sport intérieur","Jeu traditionnel","Bain / Piscine","Figurine","Autre"];
const AGES = ["0-3 ans","3-6 ans","6-12 ans","12 ans et +"];
const STATE = { IDLE:"idle", LOADING:"loading", CONFIRM:"confirm", NOT_FOUND:"not_found" };

export default function Scanner() {
  const inputRef = useRef(null);
  const [state, setState] = useState(STATE.IDLE);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [offProduct, setOffProduct] = useState(null);
  const [editForm, setEditForm] = useState({ category: "", age: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const router = useRouter();

  async function processBarcode(code) {
    if (!code) return;
    setError(""); setScannedCode(code); setState(STATE.LOADING);
    try {
      // 1. Notre base Airtable
      const res = await fetch(`/api/scan?code=${encodeURIComponent(code)}`);
      if (res.ok) { const toy = await res.json(); router.push(`/jouet/${toy.id}`); return; }

      // 2. Open Products Facts
      const offRes = await fetch(`/api/lookup?code=${encodeURIComponent(code)}`);
      const offData = await offRes.json();
      if (offData.found && offData.name) {
        setOffProduct(offData); setEditForm({ category: "", age: "" });
        setState(STATE.CONFIRM); return;
      }

      // 3. Rien trouvé
      setState(STATE.NOT_FOUND);
    } catch { setError("Erreur de connexion."); setState(STATE.IDLE); }
  }

  async function handleImageCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState(STATE.LOADING); setError("");
    try {
      const imageBitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = imageBitmap.width; canvas.height = imageBitmap.height;
      canvas.getContext("2d").drawImage(imageBitmap, 0, 0);

      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({ formats: ["ean_13","ean_8","code_128","upc_a","upc_e"] });
        const barcodes = await detector.detect(imageBitmap);
        if (barcodes.length > 0) { await processBarcode(barcodes[0].rawValue); return; }
      }

      await new Promise((resolve, reject) => {
        if (window.ZXing) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
      const dataUrl = canvas.toDataURL("image/jpeg");
      const img = new Image(); img.src = dataUrl;
      await new Promise(r => { img.onload = r; });
      const result = await new window.ZXing.BrowserMultiFormatReader().decodeFromImageElement(img);
      if (result) { await processBarcode(result.getText()); return; }

      setError("Code-barres non détecté. Réessayez ou utilisez la saisie manuelle.");
      setState(STATE.IDLE);
    } catch { setError("Code-barres non détecté. Réessayez ou utilisez la saisie manuelle."); setState(STATE.IDLE); }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleManual(e) { e.preventDefault(); await processBarcode(manualCode.trim()); }

  async function handleConfirm() {
    if (!offProduct) return;
    setSubmitting(true); setSubmitMsg("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: offProduct.name, brand: offProduct.brand,
          category: editForm.category || offProduct.category,
          age: editForm.age, barcode: scannedCode,
          comment: `Confirmé via Open Products Facts. Image: ${offProduct.imageUrl}`,
        }),
      });
      if (res.ok) {
        setSubmitMsg("✅ Merci ! Ce jouet a été ajouté pour vérification.");
        setTimeout(() => { reset(); }, 3000);
      } else { setSubmitMsg("❌ Erreur lors de l'ajout. Réessayez."); }
    } catch { setSubmitMsg("❌ Erreur de connexion."); }
    setSubmitting(false);
  }

  function reset() {
    setState(STATE.IDLE); setError(""); setScannedCode("");
    setOffProduct(null); setManualCode(""); setSubmitMsg("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <nav className="top-nav">
        {state !== STATE.IDLE
          ? <span style={{ fontSize: 20, cursor: "pointer" }} onClick={reset}>←</span>
          : <div style={{ width: 24 }} />}
        <span className="nav-title">
          {state === STATE.CONFIRM ? "Confirmer le jouet"
            : state === STATE.NOT_FOUND ? "Jouet introuvable"
            : "Scanner un jouet"}
        </span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">

        {/* CHARGEMENT */}
        {state === STATE.LOADING && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="spinner" />
            <p style={{ color: "var(--gray)", marginTop: 12 }}>Recherche du jouet…</p>
            {scannedCode && <p style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}>Code : {scannedCode}</p>}
          </div>
        )}

        {/* CONFIRMATION */}
        {state === STATE.CONFIRM && offProduct && (
          <>
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <span>🔍</span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>Jouet trouvé en ligne</p>
                <p style={{ fontSize: 12 }}>Est-ce bien ce jouet que vous venez de scanner ?</p>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                {offProduct.imageUrl ? (
                  <img src={offProduct.imageUrl} alt={offProduct.name}
                    style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 10, background: "var(--light-bg)", flexShrink: 0, border: "1px solid var(--border)" }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: 10, background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>🧸</div>
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{offProduct.name || "Nom inconnu"}</p>
                  {offProduct.brand && <p style={{ fontSize: 13, color: "var(--gray)", marginBottom: 2 }}>{offProduct.brand}</p>}
                  {offProduct.quantity && <p style={{ fontSize: 12, color: "var(--gray)" }}>{offProduct.quantity}</p>}
                  <p style={{ fontSize: 11, color: "var(--green)", marginTop: 4 }}>Code : {scannedCode}</p>
                </div>
              </div>
            </div>

            <p className="section-title">Compléter les informations</p>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Catégorie du jouet</label>
                <select className="form-input" value={editForm.category}
                  onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Choisir…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tranche d'âge</label>
                <select className="form-input" value={editForm.age}
                  onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))}>
                  <option value="">Choisir…</option>
                  {AGES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {submitMsg && (
              <div className={`alert ${submitMsg.startsWith("✅") ? "alert-info" : "alert-danger"}`} style={{ marginBottom: 16 }}>
                <p>{submitMsg}</p>
              </div>
            )}

            <button className="btn btn-primary" onClick={handleConfirm} disabled={submitting} style={{ marginBottom: 10 }}>
              {submitting ? "Ajout en cours…" : "✅ Oui, c'est bien ce jouet — Ajouter"}
            </button>
            <button className="btn btn-outline" onClick={reset}>✗ Ce n'est pas ce jouet</button>
            <p style={{ fontSize: 11, color: "var(--gray)", textAlign: "center", marginTop: 12 }}>
              Vérifié par notre équipe avant publication dans les résultats.
            </p>
          </>
        )}

        {/* PAS TROUVÉ */}
        {state === STATE.NOT_FOUND && (
          <>
            <div className="empty" style={{ paddingTop: 30 }}>
              <div className="empty-icon">🔍</div>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Jouet non référencé</p>
              <p style={{ fontSize: 13, color: "var(--gray)", marginBottom: 4 }}>Code : <strong>{scannedCode}</strong></p>
              <p style={{ fontSize: 13, color: "var(--gray)", marginBottom: 24 }}>
                Introuvable dans notre base et dans les bases mondiales. Soyez le premier à le référencer !
              </p>
            </div>
            <a href={`/soumettre?barcode=${encodeURIComponent(scannedCode)}`}
              className="btn btn-primary" style={{ textDecoration: "none", display: "block", marginBottom: 10 }}>
              ➕ Soumettre ce jouet manuellement
            </a>
            <button className="btn btn-outline" onClick={reset}>← Rescanner un autre jouet</button>
          </>
        )}

        {/* SCANNER ACCUEIL */}
        {state === STATE.IDLE && (
          <>
            {error && <div className="alert alert-warn" style={{ marginBottom: 16 }}><span>⚠️</span><p>{error}</p></div>}

            <div className="scanner-area" onClick={() => inputRef.current?.click()} style={{ cursor: "pointer" }}>
              <span style={{ fontSize: 52, zIndex: 2 }}>📷</span>
              <p style={{ color: "var(--green)", fontWeight: 600, fontSize: 15, zIndex: 2 }}>Appuyer pour scanner</p>
              <p style={{ fontSize: 12, color: "var(--gray)", zIndex: 2 }}>iPhone · Android · tous navigateurs</p>
              <input ref={inputRef} type="file" accept="image/*" capture="environment"
                onChange={handleImageCapture} style={{ display: "none" }} />
            </div>

            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              <span>🔍</span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>Recherche intelligente</p>
                <p style={{ fontSize: 12 }}>Si votre jouet n'est pas dans notre base, on consulte automatiquement les bases mondiales pour vous proposer une correspondance à confirmer.</p>
              </div>
            </div>

            <p className="section-title">Ou saisir le code manuellement</p>
            <form onSubmit={handleManual}>
              <input className="search-input" style={{ marginBottom: 12 }} type="text"
                placeholder="Ex: 3421272102001" value={manualCode}
                onChange={e => setManualCode(e.target.value)} inputMode="numeric" />
              <button className="btn btn-primary" type="submit" disabled={!manualCode.trim()}>
                Rechercher ce code
              </button>
            </form>
          </>
        )}
      </div>
      <BottomNav />
    </>
  );
}
