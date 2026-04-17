// pages/scanner.js
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import BottomNav from "../components/BottomNav";

const STATE = {
  IDLE: "idle",
  SCANNING: "scanning",
  LOADING: "loading",
  CONFIRM: "confirm",
  NOT_FOUND: "not_found",
};

export default function Scanner() {
  const videoRef = useRef(null);
  const inputRef = useRef(null);
  const [state, setState] = useState(STATE.IDLE);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [offProduct, setOffProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [quaggaLoaded, setQuaggaLoaded] = useState(false);
  const router = useRouter();
  const processingRef = useRef(false);

  // Charger Quagga au montage
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js";
    script.onload = () => setQuaggaLoaded(true);
    document.head.appendChild(script);
    return () => stopQuagga();
  }, []);

  function stopQuagga() {
    if (window.Quagga) {
      try { window.Quagga.stop(); } catch (_) {}
    }
    processingRef.current = false;
  }

  async function startLiveScanner() {
    setError("");
    if (!quaggaLoaded || !window.Quagga) {
      setError("Scanner en cours de chargement, réessayez dans 2 secondes.");
      return;
    }
    setState(STATE.SCANNING);
    try {
      await new Promise((resolve, reject) => {
        window.Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          locator: { patchSize: "medium", halfSample: true },
          numOfWorkers: 2,
          frequency: 10,
          decoder: {
            readers: ["ean_reader","ean_8_reader","code_128_reader","upc_reader","upc_e_reader"],
          },
          locate: true,
        }, (err) => { if (err) reject(err); else resolve(); });
      });

      window.Quagga.start();
      window.Quagga.onDetected((data) => {
        if (processingRef.current) return;
        const code = data.codeResult.code;
        const codes = data.codeResult.decodedCodes.filter(c => c.error !== undefined);
        const confidence = codes.reduce((s, c) => s + (1 - c.error), 0) / codes.length;
        if (confidence > 0.7) {
          processingRef.current = true;
          stopQuagga();
          processBarcode(code);
        }
      });
    } catch (e) {
      setState(STATE.IDLE);
      if (e?.name === "NotAllowedError" || String(e).includes("Permission")) {
        setError("");
        inputRef.current?.click();
      } else {
        setError("Impossible d'ouvrir la caméra. Utilisez la photo ci-dessous.");
        setState(STATE.IDLE);
      }
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

      // BarcodeDetector natif
      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({
          formats: ["ean_13","ean_8","code_128","upc_a","upc_e"]
        });
        const barcodes = await detector.detect(imageBitmap);
        if (barcodes.length > 0) { await processBarcode(barcodes[0].rawValue); return; }
      }

      // Quagga sur image statique
      if (quaggaLoaded && window.Quagga) {
        const result = await new Promise((resolve) => {
          window.Quagga.decodeSingle({
            decoder: { readers: ["ean_reader","ean_8_reader","code_128_reader","upc_reader","upc_e_reader"] },
            locate: true,
            src: canvas.toDataURL("image/jpeg", 0.9),
          }, (res) => resolve(res));
        });
        if (result?.codeResult?.code) { await processBarcode(result.codeResult.code); return; }
      }

      // ZXing fallback
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
      setError("Code-barres non détecté. Conseil : éclairez bien, tenez le téléphone à 15-20cm.");
    } catch {
      setState(STATE.IDLE);
      setError("Erreur lors de l'analyse. Réessayez avec une photo plus nette.");
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function processBarcode(code) {
    setError("");
    setScannedCode(code);
    setState(STATE.LOADING);
    try {
      // 1. Notre base Supabase en priorité
      const res = await fetch(`/api/scan?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const toy = await res.json();
        router.push(`/jouet/${toy.id}`);
        return;
      }

      // 2. Open Products Facts si pas trouvé
      const offRes = await fetch(`/api/lookup?code=${encodeURIComponent(code)}`);
      const offData = await offRes.json();
      if (offData.found && offData.name) {
        setOffProduct(offData);
        setState(STATE.CONFIRM);
        return;
      }

      setState(STATE.NOT_FOUND);
    } catch {
      setError("Erreur de connexion.");
      setState(STATE.IDLE);
    }
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
          comment: `Confirmé via Open Products Facts.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.id) router.push(`/jouet/${data.id}`);
        else { setSubmitMsg("✅ Jouet ajouté ! Score : " + data.score); setTimeout(() => reset(), 3000); }
      } else { setSubmitMsg("❌ Erreur. Réessayez."); }
    } catch { setSubmitMsg("❌ Erreur de connexion."); }
    setSubmitting(false);
  }

  function reset() {
    stopQuagga();
    setState(STATE.IDLE); setError(""); setScannedCode("");
    setOffProduct(null); setManualCode(""); setSubmitMsg("");
    processingRef.current = false;
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <nav className="top-nav">
        {state !== STATE.IDLE
          ? <span style={{ fontSize: 20, cursor: "pointer" }} onClick={reset}>←</span>
          : <div style={{ width: 24 }} />}
        <span className="nav-title">
          {state === STATE.SCANNING ? "Scannez le code-barres"
            : state === STATE.CONFIRM ? "Confirmer le jouet"
            : state === STATE.NOT_FOUND ? "Jouet introuvable"
            : "Scanner un jouet"}
        </span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">

        {/* SCAN EN DIRECT */}
        {state === STATE.SCANNING && (
          <>
            <div style={{ position: "relative", width: "100%", height: 280,
              borderRadius: 16, overflow: "hidden", background: "#000", marginBottom: 16 }}>
              <div ref={videoRef} style={{ width: "100%", height: "100%" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ width: 240, height: 140, position: "relative" }}>
                  {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos,i) => (
                    <div key={i} style={{ position: "absolute", width: 24, height: 24,
                      borderTop: pos.top===0 ? "3px solid #1D9E75" : "none",
                      borderBottom: pos.bottom===0 ? "3px solid #1D9E75" : "none",
                      borderLeft: pos.left===0 ? "3px solid #1D9E75" : "none",
                      borderRight: pos.right===0 ? "3px solid #1D9E75" : "none", ...pos }} />
                  ))}
                </div>
              </div>
              <p style={{ position: "absolute", bottom: 12, left: 0, right: 0,
                textAlign: "center", color: "white", fontSize: 12,
                background: "rgba(0,0,0,0.5)", padding: "4px 0" }}>
                Centrez le code-barres dans le cadre
              </p>
            </div>
            <button className="btn btn-outline" onClick={() => { stopQuagga(); setState(STATE.IDLE); }}>
              Annuler
            </button>
          </>
        )}

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
                style={{ marginBottom: 16 }}><p>{submitMsg}</p></div>
            )}
            <button className="btn btn-primary" onClick={handleConfirm}
              disabled={submitting} style={{ marginBottom: 10 }}>
              {submitting ? "Ajout en cours…" : "✅ Oui, c'est bien ce jouet"}
            </button>
            <button className="btn btn-outline" onClick={reset}>✗ Ce n'est pas ce jouet</button>
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
                Introuvable dans notre base. Soyez le premier à le référencer !
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

        {/* ACCUEIL */}
        {state === STATE.IDLE && (
          <>
            {error && (
              <div className="alert alert-warn" style={{ marginBottom: 16 }}>
                <span>⚠️</span><p style={{ fontSize: 13 }}>{error}</p>
              </div>
            )}

            {/* Bouton scan vidéo en direct — Android Chrome */}
            <div className="scanner-area" onClick={startLiveScanner}
              style={{ cursor: "pointer", marginBottom: 12 }}>
              <span style={{ fontSize: 48, zIndex: 2 }}>🎥</span>
              <p style={{ color: "var(--green)", fontWeight: 600, fontSize: 15, zIndex: 2 }}>
                {quaggaLoaded ? "Scan en direct" : "Chargement…"}
              </p>
              <p style={{ fontSize: 12, color: "var(--gray)", zIndex: 2 }}>
                Caméra en continu — Android Chrome
              </p>
            </div>

            {/* Bouton photo — iPhone Safari */}
            <div className="scanner-area"
              onClick={() => inputRef.current?.click()}
              style={{ cursor: "pointer", height: 100, marginBottom: 16,
                background: "#f0f8ff", borderColor: "#378ADD" }}>
              <span style={{ fontSize: 36, zIndex: 2 }}>📷</span>
              <p style={{ color: "#185FA5", fontWeight: 600, fontSize: 14, zIndex: 2 }}>
                Prendre une photo du code
              </p>
              <p style={{ fontSize: 11, color: "var(--gray)", zIndex: 2 }}>Recommandé sur iPhone Safari</p>
              <input ref={inputRef} type="file" accept="image/*" capture="environment"
                onChange={handleImageCapture} style={{ display: "none" }} />
            </div>

            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              <span>💡</span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>Conseils pour un bon scan</p>
                <p style={{ fontSize: 12 }}>Éclairez bien · 15-20cm de distance · Code net et non froissé</p>
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
