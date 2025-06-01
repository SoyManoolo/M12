// Verificar si estamos en el navegador antes de acceder a window
const isClient = typeof window !== 'undefined';

if (isClient) {
  // Guardar la función fetch original
  const originalFetch = window.fetch;

  // Sobreescribir la función fetch global
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    // Asegurar que init e init.headers existan
    const modifiedInit = init || {};
    const headers = new Headers(modifiedInit.headers || {});

    // Añadir el header para bypass de ngrok
    headers.set('Ngrok-Skip-Browser-Warning', 'true');

    // Llamar a la función fetch original con los headers modificados
    return originalFetch(input, {
      ...modifiedInit,
      headers
    });
  };

  console.log('Fetch interceptor inicializado correctamente');
}

// Exportamos una función dummy para asegurarnos de que el archivo se importe correctamente
export function initFetchInterceptor() {
  // Esta función no hace nada, solo existe para que el archivo se importe correctamente
}