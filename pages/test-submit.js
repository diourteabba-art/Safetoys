// pages/test-submit.js
// PAGE DE DEBUG — à supprimer après résolution du problème
import { useState } from "react";

export default function TestSubmit() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function test() {
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "TEST JOUET DEBUG",
          brand: "Test Brand",
          category: "Peluche",
          age: "3-6 ans",
          barcode: "1234567890123",
          comment: "Test de soumission debug",
          imageUrl: "https://example.com/image.jpg",
        }),
      });
      const data = await res.json();
      setResult({ status: res.status, data });
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: 24, fontFamily: "monospace" }}>
      <h2>🔧 Test Soumission Airtable</h2>
      <button onClick={test} disabled={loading}
        style={{ padding: "10px 20px", margin: "16px 0", cursor: "pointer" }}>
        {loading ? "Test en cours..." : "Lancer le test"}
      </button>
      {result && (
        <div>
          <p>Status HTTP : <strong>{result.status}</strong></p>
          <pre style={{ background: result.data?.success ? "#e1f5ee" : "#fcebeb",
            padding: 16, borderRadius: 8, overflow: "auto", fontSize: 12 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          {result.data?.success && (
            <p style={{ color: "green", fontWeight: "bold" }}>
              ✅ Soumission réussie ! ID : {result.data.id}
            </p>
          )}
          {result.data?.detail && (
            <p style={{ color: "red" }}>
              ❌ Erreur Airtable : {result.data.detail}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
