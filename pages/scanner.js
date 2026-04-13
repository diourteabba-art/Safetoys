import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import BottomNav from "../components/BottomNav";

export default function Scanner() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const readerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [libLoaded, setLibLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Charger ZXing dynamiquement
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js";
    script.onload = () => setLibLoaded(true);
    script.onerror = () => setError("Impossible de charger le scanner. Utilisez la saisie manuelle.");
    document.head.appendChild(script);
    return () => {
      stopCamera();
      document.head.removeChild(script);
    };
  }, []);

  async function startCamera() {
    setError("");
    if (!libLoaded) {
      setError("Scanner en cours de chargement, réessayez dans 2 secondes.");
      return;
    }
    try {
      const ZXing = window.ZXing;
      const hints = new Map();
      const formats = [
        ZXing.BarcodeFormat.EAN_13,
        ZXing.BarcodeFormat.EAN_8,
        ZXing.BarcodeFormat.CODE_128,
        ZXing.BarcodeFormat.UPC_A,
        ZXing.BarcodeFormat.UPC_E,
      ];
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);

      const reader = new ZXing.BrowserMultiFormatReader(hints);
      readerRef.current = reader;

      const devices = await ZXing.BrowserCodeReader.listVideoInputDevices();
      // Préférer la caméra arrière
      const device = devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("arrière") ||
        d.label.toLowerCase().includes("environment")
      ) || devices[devices.length - 1] || devices[0];

      if (!device) {
        setError("Aucune caméra détectée. Utilisez la saisie manuelle.");
        return;
      }

      setScanning(true);

      await reader.decodeFromVideoDevice(
        device.deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const code = result.getText();
            stopCamera();
            lookupBarcode(code);
          }
        }
      );
    } catch (e) {
      setScanning(false);
      if (e.name === "NotAllowedError") {
        setError("Accès à la caméra refusé. Autorisez la caméra dans les réglages de votre navigateur.");
      } else {
        setError("Impossible d'accéder à la caméra. Utilisez la saisie manuelle.");
      }
    }
  }

  function stopCamera() {
    if (readerRef.current) {
      try { readerRef.current.reset(); } catch (_) {}
      readerRef.current = null;
    }
    setScanning(false);
  }

  async function lookupBarcode(code) {
    setLoading(true);
    try {
      const res = await fetch(`/api/scan?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const toy = await res.json();
        router.push(`/jouet/${toy.id}`);
      } else {
        router.push(`/soumettre?barcode=${encodeURIComponent(code)}`);
      }
    } catch {
      setError("Erreur de connexion.");
      setLoading(false);
    }
  }

  async function handleManual(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
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
        {error && <div className="alert alert-warn" style={{ marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <div>
            <div className="spinner" />
            <p style={{ textAlign: "center", color: "var(--gray)" }}>Recherche en cours…</p>
          </div>
        ) : (
          <>
            {/* Zone scanner */}
            <div
              className="scanner-area"
              onClick={!scanning ? startCamera : undefined}
              style={{ cursor: scanning ? "default" : "pointer" }}
            >
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  objectFit: "cover", borderRadius: 14,
                  display: scanning ? "block" : "none"
                }}
              />
              {scanning && (
                <div className="scanner-overlay">
                  <div style={{
                    width: 200, height: 200,
                    border: "2px solid white",
                    borderRadius: 12,
                    position: "relative"
                  }}>
                    <div className="scanner-line" />
                    {/* Coins */}
                    {[
                      { top: -2, left: -2, borderTop: "4px solid #1D9E75", borderLeft: "4px solid #1D9E75" },
                      { top: -2, right: -2, borderTop: "4px solid #1D9E75", borderRight: "4px solid #1D9E75" },
                      { bottom: -2, left: -2, borderBottom: "4px solid #1D9E75", borderLeft: "4px solid #1D9E75" },
                      { bottom: -2, right: -2, borderBottom: "4px solid #1D9E75", borderRight: "4px solid #1D9E75" },
                    ].map((style, i) => (
                      <div key={i} style={{ position: "absolute", width: 20, height: 20, borderRadius: 2, ...style }} />
                    ))}
                  </div>
                  <p style={{ color: "white", fontSize: 12, marginTop: 12, background: "rgba(0,0,0,0.5)", padding: "4px 10px", borderRadius: 20 }}>
                    Centrez le code-barres
                  </p>
                </div>
              )}
              {!scanning && (
                <>
                  <span style={{ fontSize: 48, zIndex: 2 }}>📷</span>
                  <p style={{ color: "var(--green)", fontWeight: 600, zIndex: 2 }}>
                    {libLoaded ? "Appuyer pour scanner" : "Chargement…"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--gray)", zIndex: 2 }}>
                    Compatible iPhone et Android
                  </p>
                </>
              )}
            </div>

            {scanning && (
              <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={stopCamera}>
                Arrêter la caméra
              </button>
            )}

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
              <button className="btn btn-primary" type="submit">
                Rechercher ce code
              </button>
            </form>

            <div className="alert alert-info" style={{ marginTop: 16 }}>
              <span>ℹ️</span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>Compatibilité</p>
                <p>Le scan fonctionne sur iPhone (Safari) et Android (Chrome). Autorisez l'accès à la caméra quand le navigateur le demande.</p>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </>
  );
}
