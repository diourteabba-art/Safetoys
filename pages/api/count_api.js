// pages/api/count.js
export default async function handler(req, res) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { count } = await supabase
      .from('produits')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'verifie');

    return res.status(200).json({ count: count || 0 });
  } catch (e) {
    return res.status(200).json({ count: 0 });
  }
}
