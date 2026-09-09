// Utilidades mínimas de cookies del navegador — sin dependencias externas.
// Usadas para preferencias puramente personales del visitante (ej. idioma),
// nunca para datos de sesión (eso lo maneja el backend con cookie httpOnly).

export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name, value, days) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}
