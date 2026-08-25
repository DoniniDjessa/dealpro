export const PSEUDO_PATTERN = /^[a-z0-9._]{3,24}$/

export function normalizePseudo(value: string) {
  return value.trim().toLowerCase()
}

export function looksLikeEmail(value: string) {
  return value.includes('@')
}

export function validatePseudo(value: string) {
  const pseudo = normalizePseudo(value)
  if (!PSEUDO_PATTERN.test(pseudo)) {
    return 'Le pseudo doit faire 3 à 24 caractères (lettres, chiffres, . ou _).'
  }
  return null
}
