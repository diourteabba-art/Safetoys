// pages/scanner.js
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import BottomNav from "../components/BottomNav";

const STATE = {
  IDLE: "idle",
  LOADING: "loading",
  CONFIRM: "confirm",
  NOT_FOUND: "not_found",
};

export default function Scanner() {
  const inputRef = useRef(null);
  const [state, setState] = useState(STATE.IDLE);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [offProduct, setOffProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const router = useRouter();

  // Charger Quagga au montage pour accélérer le scan
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Quagga) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js";
      document.head.appendChild(script);
    }
  });

  async function processBarcode(code) {
    if (!code) return;
    setError("");
    setScannedCode(code);
    setState(STATE.LOADING);

    try {
      // 1. Cherche D'ABORD dans notre base Supabase
      const res = await fetch(`/api/scan?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const toy = await res.json();
        // Trouvé dans notre base → fiche produit directement
        router.push(`/jouet/${toy.id}`);
        return;
      }

      // 2. Seulement si pas trouvé → cherche sur Open Products Facts
      const offRes = await fetch(`/api/lookup?code=${encodeURIComponent(code)}`);
      const offData = await offRes.json();

      if (offData.found && offData.name) {
        setOffProduct(offData);
        setState(STATE.CONFIRM);
        return;
      }

      // 3. Rien trouvé nulle part
      setState(STATE.NOT_FOUND);
    } catch {
      setError("Erreur de connexion.");
      setState(STATE.IDLE);
    }
  }

  async function handleImageCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState(STATE.LOADING);
    setError("");

    try {
      const imageBitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const maxDim = 1200;
      const ratio = Math.min(maxDim / imageBitmap.width, maxDim / imageBitmap.height, 1);
      canvas.width = Math.round(imageBitmap.width * ratio);
      canvas.height = Math.round(imageBitmap.height * ratio);
      canvas.getContext("2d").drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

      // Essai 1 : BarcodeDetector natif
      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"]
        });
        const barcodes = await detector.detect(imageBitmap);
        if (barcodes.length > 0) {
          await processBarcode(barcodes[0].rawValue);
          return;
        }
      }

      // Essai 2 : Quagga
      if (window.Quagga) {
        const result = await new Promise((resolve) => {
          window.Quagga.decodeSingle({
            decoder: { readers: ["ean_reader","ean_8_reader","code_128_reader","upc_reader"] },
            locate: true,
            src: canvas.toDataURL("image/jpeg", 0.9),
          }, (res) => resolve(res));
        });
        if (result?.codeResult?.code) {
          await processBarcode(result.codeResult.code);
          return;
        }
      }

      // Essai 3 : ZXing
      await new Promise((resolve, reject) => {
        if (window.ZXing) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
      const img = new Image();
      img.src = canvas.toDataURL("image/jpeg");
      await new Promise(r => { img.onload = r; });
      const zxResult = await new window.ZXing.BrowserMultiFormatReader()
        .decodeFromImageElement(img).catch(() => null);
      if (zxResult) { await processBarcode(zxResult.getText()); return; }

      setState(STATE.IDLE);
      setError("Code-barres non détecté. Conseil : éclairez bien le code, tenez le téléphone à 15-20cm.");
    } catch {
      setState(STATE.IDLE);
      setError("Erreur lors de l'analyse. Réessayez avec une photo plus nette.");
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleManual(e) {
    e.preventDefault();
    await processBarcode(manualCode.trim());
  }

  async function handleConfirm() {
    if (!offProduct) return;
    setSubmitting(true);
    setSubmitMsg("");
    try {
      const res = await fetch("/api/soumettre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: offProduct.name,
          brand: offProduct.brand,
          category: offProduct.category || "",
          age: "",
          barcode: scannedCode,
          imageUrl: offProduct.imageUrl || "",
          materiaux: (offProduct.materials || []).join(", "),
          comment: `Confirmé via Open Products Facts. Quantité: ${offProduct.quantity || "NC"}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Rediriger vers la fiche produit si on a l'ID
        if (data.id) {
          router.push(`/jouet/${data.id}`);
        } else {
          setSubmitMsg("✅ Jouet ajouté ! Score provisoire : " + data.score);
          setTimeout(() => reset(), 3000);
        }
      } else {
        setSubmitMsg("❌ Erreur. Réessayez.");
      }
    } catch {
      setSubmitMsg("❌ Erreur de connexion.");
    }
    setSubmitting(false);
  }

  function reset() {
    setState(STATE.IDLE);
    setError("");
    setScannedCode("");
    setOffProduct(null);
    setManualCode("");
    setSubmitMsg("");
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

        {/* CONFIRMATION Open Products Facts */}
        {state === STATE.CONFIRM && offProduct && (
          <>
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <span>🔍</span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>Jouet identifié en ligne</p>
                <p style={{ fontSize: 12 }}>Non trouvé dans notre base. Confirmez pour l'ajouter.</p>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              {offProduct.imageUrl && (
                <img src={offProduct.imageUrl} alt={offProduct.name}
                  style={{ width: "100%", maxHeight: 200, objectFit: "contain",
                    borderRadius: 10, marginBottom: 14, background: "#f7fbf9" }} />
              )}
              <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{offProduct.name}</p>
              {offProduct.brand && <p style={{ fontSize: 13, color: "var(--gray)", marginBottom: 2 }}>{offProduct.brand}</p>}
              {offProduct.quantity && <p style={{ fontSize: 12, color: "var(--gray)" }}>{offProduct.quantity}</p>}
              <span className="tag tag-warn" style={{ marginTop: 8, display: "inline-block" }}>
                ⚠ Composition chimique non encore évaluée
              </span>
            </div>

            {submitMsg && (
              <div className={`alert ${submitMsg.startsWith("✅") ? "alert-info" : "alert-danger"}`}
                style={{ marginBottom: 16 }}>
                <p>{submitMsg}</p>
              </div>
            )}

            <button className="btn btn-primary" onClick={handleConfirm}
              disabled={submitting} style={{ marginBottom: 10 }}>
              {submitting ? "Ajout en cours…" : "✅ Oui, c'est bien ce jouet"}
            </button>
            <button className="btn btn-outline" onClick={reset}>✗ Ce n'est pas ce jouet</button>
            <p style={{ fontSize: 11, color: "var(--gray)", textAlign: "center", marginTop: 12 }}>
              Le score sera calculé automatiquement selon ECHA/REACH.
            </p>
          </>
        )}

        {/* PAS TROUVÉ */}
        {state === STATE.NOT_FOUND && (
          <>
            <div className="empty" style={{ paddingTop: 30 }}>
              <div className="empty-icon">🔍</div>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Jouet non référencé</p>
              <p style={{ fontSize: 13, color: "var(--gray)", marginBottom: 4 }}>
                Code : <strong>{scannedCode}</strong>
              </p>
              <p style={{ fontSize: 13, color: "var(--gray)", marginBottom: 24 }}>
                Introuvable dans notre base et dans les bases mondiales. Soyez le premier à le référencer !
              </p>
            </div>
            <a href={`/soumettre?barcode=${encodeURIComponent(scannedCode)}`}
              className="btn btn-primary"
              style={{ textDecoration: "none", display: "block", marginBottom: 10 }}>
              ➕ Soumettre ce jouet
            </a>
            <button className="btn btn-outline" onClick={reset}>← Rescanner</button>
          </>
        )}

        {/* ACCUEIL SCANNER */}
        {state === STATE.IDLE && (
          <>
            {error && (
              <div className="alert alert-warn" style={{ marginBottom: 16 }}>
                <span>⚠️</span>
                <p style={{ fontSize: 13 }}>{error}</p>
              </div>
            )}

            <div className="scanner-area"
              onClick={() => inputRef.current?.click()}
              style={{ cursor: "pointer", marginBottom: 12 }}>
              <span style={{ fontSize: 48, zIndex: 2 }}>📷</span>
              <p style={{ color: "var(--green)", fontWeight: 600, fontSize: 15, zIndex: 2 }}>
                Appuyer pour scanner
              </p>
              <p style={{ fontSize: 12, color: "var(--gray)", zIndex: 2 }}>
                iPhone · Android · tous navigateurs
              </p>
              <input ref={inputRef} type="file" accept="image/*" capture="environment"
                onChange={handleImageCapture} style={{ display: "none" }} />
            </div>

            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              <span>💡</span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>Recherche intelligente</p>
                <p style={{ fontSize: 12 }}>
                  On cherche d'abord dans notre base SafeToys. Si le jouet n'est pas trouvé, 
                  on consulte les bases mondiales.
                </p>
              </div>
            </div>

            <p className="section-title">Ou saisir le code manuellement</p>
            <form onSubmit={handleManual}>
              <input className="search-input" style={{ marginBottom: 12 }}
                type="text" placeholder="Ex: 3421272102001"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                inputMode="numeric" />
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
