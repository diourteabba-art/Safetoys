// pages/index.js
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "../components/BottomNav";

export async function getServerSideProps() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    const { count } = await supabase
      .from('produits')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'verifie');
    return { props: { count: count || 0 } };
  } catch {
    return { props: { count: 0 } };
  }
}

const SCORE_INFO = {
  A: { label: 'Sûr',              bg: '#E1F5EE', color: '#085041', desc: 'Aucune substance réglementée identifiée' },
  B: { label: 'Vigilance légère', bg: '#F0F8E8', color: '#27500A', desc: 'Substances sous surveillance réglementaire' },
  C: { label: 'Modéré',           bg: '#FAEEDA', color: '#633806', desc: 'Substances soumises à restriction REACH/EN 71' },
  D: { label: 'Danger élevé',     bg: '#FCEBEB', color: '#501313', desc: 'Substances interdites ou fortement restreintes' },
};

export default function Home({ count }) {
  return (
    <>
      <div className="page-body" style={{ paddingTop: 0 }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)',
          borderRadius: '0 0 28px 28px',
          padding: '48px 24px 32px',
          marginLeft: -16, marginRight: -16,
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>
              by la communauté
            </span>
          </div>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800,
            lineHeight: 1.25, marginBottom: 10 }}>
            Protégez vos enfants.<br />Scannez un jouet,<br />vérifiez sa sécurité.
          </h1>
          <Link href="/scanner"
            style={{ display: 'inline-block', background: 'white',
              color: '#0F6E56', fontWeight: 700, fontSize: 16,
              padding: '14px 28px', borderRadius: 14,
              textDecoration: 'none', marginBottom: 20 }}>
            📷 Scanner maintenant
          </Link>
        </div>

        {/* Actions rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <Link href="/recherche" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🔍</div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Rechercher</p>
              <p style={{ fontSize: 11, color: 'var(--gray)' }}>Par nom ou marque</p>
            </div>
          </Link>
          <Link href="/soumettre" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>➕</div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Soumettre</p>
              <p style={{ fontSize: 11, color: 'var(--gray)' }}>Ajouter un jouet</p>
            </div>
          </Link>
        </div>

        {/* Compteur */}
        <div className="card" style={{ textAlign: 'center', marginBottom: 20,
          background: 'linear-gradient(135deg, #E1F5EE, #f7fbf9)', border: 'none' }}>
          <p style={{ fontSize: 36, fontWeight: 800, color: '#0F6E56', marginBottom: 4 }}>
            {count.toLocaleString('fr-FR')}
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0F6E56', marginBottom: 4 }}>
            jouets référencés
          </p>
          <p style={{ fontSize: 12, color: 'var(--gray)' }}>
            Base mise à jour grâce à la communauté SafeToys
          </p>
        </div>

        {/* Comprendre les scores */}
        <p className="section-title">Comprendre les scores</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {Object.entries(SCORE_INFO).map(([score, info], i) => (
            <div key={score} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
            }}>
              <div className={`score-badge score-${score}`}
                style={{ width: 36, height: 36, fontSize: 16, flexShrink: 0 }}>
                {score}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: info.color, marginBottom: 2 }}>
                  {info.label}
                </p>
                <p style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.4 }}>
                  {info.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{ background: 'var(--light-bg)', borderRadius: 12,
          padding: '12px 14px', marginTop: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.6 }}>
            🔬 Scores calculés selon les réglementations ECHA/REACH/EN 71 en vigueur.
            Les informations SafeToys sont indicatives et ne remplacent pas un test de laboratoire accrédité.
          </p>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
