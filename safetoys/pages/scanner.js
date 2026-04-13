import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import BottomNav from "../components/BottomNav";

export default function Scanner() {
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      startDecoding();
    } catch (e) {
      setError("Impossible d'accéder à la caméra. Utilisez la saisie manuelle.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setScanning(false);
  }

  function startDecoding() {
    // On utilise BarcodeDetector si disponible (Chrome Android/Desktop)
    if (!("BarcodeDetector" in window)) return;
    const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "upc_a"] });
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          stopCamera();
          lookupBarcode(code);
        }
      } catch (_) {}
    }, 500);
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
    } finally {
      setLoading(false);
    }
  }

  async function handleManual(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await lookupBarcode(manualCode.trim());
  }

  useEffect(() => () => stopCamera(), []);

  return (
    <>
      <nav className="top-nav">
        <span style={{ fontSize: 20, cursor: "pointer" }} onClick={() => router.back()}>←</span>
        <span className="nav-title">Scanner un jouet</span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">
        {error && <div className="alert alert-warn">{error}</div>}

        {loading ? (
          <div>
            <div className="spinner" />
            <p style={{ textAlign: "center", color: "var(--gray)" }}>Recherche en cours…</p>
          </div>
        ) : (
          <>
            {/* Zone scanner */}
            <div className="scanner-area" onClick={!scanning ? startCamera : undefined}>
              {scanning ? (
                <>
                  <video ref={videoRef} muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }} />
                  <div className="scanner-overlay">
                    <div className="scanner-line" />
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 48 }}>📷</span>
                  <p style={{ color: "var(--green)", fontWeight: 600 }}>Appuyer pour scanner</p>
                  <p style={{ fontSize: 12, color: "var(--gray)" }}>Pointez vers le code-barres</p>
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
              <button className="btn btn-primary" type="submit">Rechercher ce code</button>
            </form>

            {/* Info compatibilité */}
            <div className="alert alert-info" style={{ marginTop: 16 }}>
              <span>ℹ️</span>
              <p>Le scan automatique fonctionne sur Chrome (Android & desktop). Sur iPhone, utilisez la saisie manuelle ou Safari.</p>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </>
  );
}
