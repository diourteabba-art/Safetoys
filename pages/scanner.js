import { useRef, useState } from "react";
import { useRouter } from "next/router";
import BottomNav from "../components/BottomNav";

export default function Scanner() {
  const inputRef = useRef(null);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanned, setScanned] = useState("");
  const router = useRouter();

  async function lookupBarcode(code) {
    if (!code || loading) return;
    setLoading(true);
    setError("");
    setScanned(code);
    try {
      const res = await fetch(`/api/scan?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const toy = await res.json();
        router.push(`/jouet/${toy.id}`);
      } else {
        router.push(`/soumettre?barcode=${encodeURIComponent(code)}`);
      }
    } catch {
      setError("Erreur de connexion. Vérifiez votre réseau.");
      setLoading(false);
    }
  }

  async function handleImageCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const imageBitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imageBitmap, 0, 0);

      // Essayer BarcodeDetector natif (Chrome Android)
      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"]
        });
        const barcodes = await detector.detect(imageBitmap);
        if (barcodes.length > 0) {
          await lookupBarcode(barcodes[0].rawValue);
          return;
        }
      }

      // Fallback ZXing pour iPhone Safari
      await new Promise((resolve, reject) => {
        if (window.ZXing) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });

      const dataUrl = canvas.toDataURL("image/jpeg");
      const img = new Image();
      img.src = dataUrl;
      await new Promise(r => { img.onload = r; });

      const reader = new window.ZXing.BrowserMultiFormatReader();
      const result = await reader.decodeFromImageElement(img);
      if (result) {
        await lookupBarcode(result.getText());
        return;
      }

      setLoading(false);
      setError("Code-barres non détecté. Réessayez en vous rapprochant, bien cadré et éclairé.");
    } catch {
      setLoading(false);
      setError("Code-barres non détecté. Réessayez ou utilisez la saisie manuelle.");
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleManual(e) {
    e.preventDefault();
    await lookupBarcode(manualCode.trim());
  }

  return (
    <>
      <nav className="top-nav">
        <span style={{ fontSize: 20, cursor: "pointer" }} onClick={() => router.back()}>←</span>
        <span className="nav-title">Scanner un jouet</span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">

        {error && (
          <div className="alert alert-warn" style={{ marginBottom: 16 }}>
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="spinner" />
            <p style={{ color: "var(--gray)", marginTop: 8 }}>
              {scanned ? `Code : ${scanned} — recherche…` : "Analyse en cours…"}
            </p>
          </div>
        ) : (
          <>
            {/* Zone scanner — ouvre la caméra native */}
            <div
              className="scanner-area"
              onClick={() => inputRef.current?.click()}
              style={{ cursor: "pointer" }}
            >
              <span style={{ fontSize: 52, zIndex: 2 }}>📷</span>
              <p style={{ color: "var(--green)", fontWeight: 600, fontSize: 15, zIndex: 2 }}>
                Appuyer pour scanner
              </p>
              <p style={{ fontSize: 12, color: "var(--gray)", zIndex: 2 }}>
                iPhone · Android · tous navigateurs
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                style={{ display: "none" }}
              />
            </div>

            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              <span>💡</span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>Comment scanner</p>
                <p style={{ fontSize: 12 }}>Appuyez sur la zone → la caméra s'ouvre → photographiez le code-barres → l'app trouve le jouet automatiquement.</p>
              </div>
            </div>

            {/* Saisie manuelle */}
            <p className="section-title">Ou saisir le code manuellement</p>
            <form onSubmit={handleManual}>
              <input
                className="search-input"
                style={{ marginBottom: 12 }}
                type="text"
                placeholder="Ex: 3421272102001"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                inputMode="numeric"
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!manualCode.trim()}
              >
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
