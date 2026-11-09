// Descarga autenticada compartida (admin y cliente) — nunca navega a la URL
// del backend directamente (eso expone la URL y, sin el interceptor de
// `api`, falla con "Sesión no encontrada"). Siempre pide el archivo como
// Blob con el cliente HTTP autenticado y dispara la descarga desde un
// Blob URL temporal, que se revoca apenas el navegador toma el archivo.
export function triggerBlobDownload(blobUrl, fileName) {
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName || 'archivo';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadAuthenticatedFile(api, url, fileName) {
  const { data: blob } = await api.get(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(blob);
  triggerBlobDownload(objectUrl, fileName);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
