/** Divide el texto en tokens de palabras y espacios; join("") reconstruye el original. */
export function splitWords(text: string): string[] {
  return text.match(/\s+|[^\s]+/gu) ?? [];
}
