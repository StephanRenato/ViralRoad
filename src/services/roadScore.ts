
/**
 * Cálculo do Road Score (0-100) baseado em métricas reais
 */
export function roadScore(profile: any) {
  let score = 0;

  // 1. Seguidores (Máx 30 pontos)
  if (profile.followers > 1000000) score += 30;
  else if (profile.followers > 100000) score += 25;
  else if (profile.followers > 50000) score += 20;
  else if (profile.followers > 10000) score += 15;
  else if (profile.followers > 1000) score += 10;
  else if (profile.followers > 0) score += 5;

  // 2. Engajamento (Máx 40 pontos)
  if (profile.engagement_rate > 10) score += 40;
  else if (profile.engagement_rate > 5) score += 30;
  else if (profile.engagement_rate > 3) score += 20;
  else if (profile.engagement_rate > 1) score += 10;
  else if (profile.engagement_rate > 0) score += 5;

  // 3. Consistência / Volume de Posts (Máx 20 pontos)
  if (profile.posts > 500) score += 20;
  else if (profile.posts > 100) score += 15;
  else if (profile.posts > 50) score += 10;
  else if (profile.posts > 10) score += 5;

  // 4. Bônus de Verificação (Máx 10 pontos)
  if (profile.is_verified) score += 10;

  // Garantir limite
  if (score > 100) score = 100;

  // Insights baseados no Score
  let insight = "";
  if (score >= 90) {
    insight = "Perfil de Elite. Autoridade máxima detectada. Estratégia: Escala global e monetização agressiva.";
  } else if (score >= 75) {
    insight = "Perfil Viral. Alto engajamento e crescimento. Estratégia: Otimização de conversão e parcerias premium.";
  } else if (score >= 50) {
    insight = "Perfil em Ascensão. Base sólida construída. Estratégia: Aumentar frequência e diversificar formatos.";
  } else if (score >= 30) {
    insight = "Perfil em Desenvolvimento. Necessita de ganchos mais fortes e melhor linha editorial.";
  } else {
    insight = "Perfil Inicial. Foco total em descoberta e construção de audiência base.";
  }

  return {
    score,
    insight
  };
}
