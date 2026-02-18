
type NormalizedProfile = {
  platform: string
  followers: number | null
  following: number | null
  posts: number | null
  likes: number | null
  engagement: number
}

export function roadScore(profile: NormalizedProfile) {
  let score = 0

  // BASE DO SCORE
  if (profile.followers && profile.followers > 1000) score += 20
  if (profile.followers && profile.followers > 10000) score += 20
  if (profile.followers && profile.followers > 50000) score += 20

  if (profile.engagement >= 2) score += 15
  if (profile.engagement >= 5) score += 15
  if (profile.engagement >= 10) score += 10

  if (profile.posts && profile.posts > 30) score += 10
  if (profile.posts && profile.posts > 100) score += 10

  if (score > 100) score = 100

  // INSIGHT AUTOMÁTICO (REAL)
  let insight = "Perfil em estágio inicial."

  if (score >= 80) {
    insight =
      "Perfil com alto potencial viral. Foque em consistência, colabs e conteúdos reaproveitáveis."
  } else if (score >= 60) {
    insight =
      "Bom desempenho, mas falta escalar. Trabalhe ganchos fortes e CTA claros."
  } else if (score >= 40) {
    insight =
      "Perfil com base construída, porém com baixo engajamento. Ajuste formato e storytelling."
  } else {
    insight =
      "Perfil ainda não otimizado. Priorize frequência, bio clara e conteúdos educativos."
  }

  return {
    score,
    insight
  }
}
