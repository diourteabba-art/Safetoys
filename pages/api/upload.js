// pages/api/upload.js
// Upload image vers Supabase Storage

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { image, filename } = req.body;
  if (!image) return res.status(400).json({ error: 'Image manquante' });

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Convertir base64 en buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = image.split(';')[0].split('/')[1] || 'jpg';
    const path = `${Date.now()}_${filename || 'jouet'}.${ext}`;

    const { data, error } = await supabase.storage
      .from('jouets-images')
      .upload(path, buffer, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) {
      console.error('Storage error:', error);
      return res.status(500).json({ error: 'Erreur upload' });
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('jouets-images')
      .getPublicUrl(path);

    return res.status(200).json({ url: urlData.publicUrl });
  } catch (e) {
    console.error('Upload error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
