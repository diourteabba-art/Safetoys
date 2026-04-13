export async function getServerSideProps() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  const checks = {
    baseId: baseId ? `✅ ${baseId.substring(0, 6)}...` : "❌ MANQUANT",
    token: token ? `✅ ${token.substring(0, 6)}...` : "❌ MANQUANT",
    tableName: tableName ? `✅ "${tableName}"` : "❌ MANQUANT",
  };

  let airtableResult = "Non testé";
  let records = [];

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=3`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const text = await res.text();
    if (res.ok) {
      const data = JSON.parse(text);
      records = (data.records || []).map(r => r.fields["Nom du jouet"] || r.id);
      airtableResult = `✅ Connexion OK — ${data.records?.length} enregistrements reçus`;
    } else {
      airtableResult = `❌ Erreur ${res.status} — ${text.substring(0, 200)}`;
    }
  } catch (e) {
    airtableResult = `❌ Exception: ${e.message}`;
  }

  return { props: { checks, airtableResult, records } };
}

export default function Debug({ checks, airtableResult, records }) {
  const s = { fontFamily: "monospace", padding: "6px 10px", borderRadius: 6, marginBottom: 8, background: "#f5f5f5", fontSize: 13 };
  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 20 }}>🔧 Diagnostic SafeToys</h2>

      <h3 style={{ marginBottom: 10 }}>Variables d'environnement</h3>
      <div style={s}>AIRTABLE_BASE_ID : {checks.baseId}</div>
      <div style={s}>AIRTABLE_TOKEN : {checks.token}</div>
      <div style={s}>AIRTABLE_TABLE_NAME : {checks.tableName}</div>

      <h3 style={{ margin: "20px 0 10px" }}>Test connexion Airtable</h3>
      <div style={{ ...s, background: airtableResult.startsWith("✅") ? "#e1f5ee" : "#fcebeb" }}>
        {airtableResult}
      </div>

      {records.length > 0 && (
        <>
          <h3 style={{ margin: "20px 0 10px" }}>Premiers jouets trouvés</h3>
          {records.map((r, i) => <div key={i} style={s}>{r}</div>)}
        </>
      )}
    </div>
  );
}
