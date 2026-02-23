import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const {
      profileUrl,
      objective,
      niche,
      platform,
      format,
      funnelStage
    } = req.body || {};

    if (!profileUrl || !platform) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes" });
    }

    const result = {
      status: "ok",
      platform,
      profileUrl,
      objective,
      roadScore: 85, 
      insights: `Estratégia detectada para ${niche || 'o perfil'}: Focar em ${format || 'conteúdo viral'} no estágio de ${funnelStage || 'Consciência'}.`,
      strategy: {
        hook: "Você está cometendo esse erro sem perceber",
        contentIdea: "Vídeo explicando o erro mais comum no nicho",
        cta: "Siga para mais estratégias"
      }
    };

    return res.status(200).json(result);

  } catch (error: any) {
    return res.status(500).json({
        error: "Erro interno na função",
        details: error.message
    });
  }
}
