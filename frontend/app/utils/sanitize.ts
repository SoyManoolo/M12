import DOMPurify from 'dompurify';

/** Sanitiza el contenido procedente de perfiles, publicaciones y comentarios. */
export function sanitizeUserText(value: string | null | undefined): string {
  if (!value) return '';

  // Durante SSR no existe DOM; React seguirá escapando el texto y quitamos
  // las etiquetas para conservar el mismo resultado que en el navegador.
  if (typeof window === 'undefined') return value.replace(/<[^>]*>/g, '');

  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
