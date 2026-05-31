/**
 * Service Worker para MangaAura PWA
 * 
 * Estrategias de cache:
 * - App Shell: CacheFirst
 * - Imágenes: CacheFirst con límite
 * - API: NetworkFirst con fallback a cache
 * - Fonts: CacheFirst
 */

const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `mangaaura-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `mangaaura-images-${CACHE_VERSION}`;
const API_CACHE = `mangaaura-api-${CACHE_VERSION}`;
const FONT_CACHE = `mangaaura-fonts-${CACHE_VERSION}`;
const RUNTIME_CACHE = `mangaaura-runtime-${CACHE_VERSION}`;

// App Shell - Recursos críticos para la app
const APP_SHELL = [
  '/',
  '/offline',
  '/explore',
  '/library',
  '/notifications',
  '/search',
];

// Instalación: Cachear App Shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching App Shell');
      return cache.addAll(APP_SHELL);
    }).catch((error) => {
      console.error('[SW] Error caching App Shell:', error);
    })
  );
  
  self.skipWaiting();
});

// Activación: Limpiar caches antiguas
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== IMAGE_CACHE &&
            cacheName !== API_CACHE
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Limitar tamaño del cache de imágenes (máximo 200 entradas)
const MAX_IMAGE_CACHE = 200;
const MAX_API_CACHE = 100;

// Limpiar cache si excede el límite
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Eliminar las entradas más antiguas
    const toDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(toDelete.map(key => cache.delete(key)));
  }
}

// Verificar si una URL es de un origen confiable
function isTrustedOrigin(url) {
  const trustedOrigins = [
    self.location.origin,
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://images.mangaaura.es',
    'https://cdn.mangaaura.es',
  ];
  return trustedOrigins.some(origin => url.startsWith(origin));
}

// Fetch: Estrategias de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Solo cachear recursos del mismo origen o CDNs confiables
  if (!isTrustedOrigin(url.origin)) return;
  
  // Estrategia para imágenes
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif|svg)$/)) {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // Estrategia para APIs
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Estrategia para fonts
  if (request.destination === 'font') {
    event.respondWith(handleFontRequest(request));
    return;
  }
  
  // Estrategia para App Shell (HTML)
  if (request.destination === 'document') {
    event.respondWith(handleAppShellRequest(request));
    return;
  }
  
  // Por defecto: NetworkFirst
  event.respondWith(networkFirst(request));
});

// Estrategia: CacheFirst para imágenes con límite y fallback visual
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Refrescar cache en background (solo si la imagen tiene más de 1 hora)
    const cachedTime = cached.headers.get('sw-cached-time');
    const shouldRefresh = !cachedTime || (Date.now() - parseInt(cachedTime)) > 3600000;
    if (shouldRefresh) {
      fetch(request).then(async (response) => {
        if (response.ok) {
          const clonedResponse = response.clone();
          const newHeaders = new Headers(clonedResponse.headers);
          newHeaders.set('sw-cached-time', String(Date.now()));
          const newResponse = new Response(clonedResponse.body, {
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
            headers: newHeaders,
          });
          await cache.put(request, newResponse);
          await trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE);
        }
      }).catch(() => {});
    }
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clonedResponse = response.clone();
      const newHeaders = new Headers(clonedResponse.headers);
      newHeaders.set('sw-cached-time', String(Date.now()));
      const newResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: newHeaders,
      });
      await cache.put(request, newResponse);
      await trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE);
    }
    return response;
  } catch {
    // Si hay imagen en cache aunque esté expirada, servirla
    const anyCached = await cache.match(request);
    if (anyCached) return anyCached;
    
    // Fallback a SVG placeholder transparente
    const svgPlaceholder = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect fill="#1e293b" width="400" height="600"/><text fill="#64748b" font-family="sans-serif" font-size="14" text-anchor="middle" x="200" y="300">Imagen no disponible offline</text></svg>';
    return new Response(svgPlaceholder, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
    });
  }
}

// APIs que pueden cachearse (solo GET)
const CACHEABLE_API_PATHS = [
  '/api/manga',
  '/api/manga/',
  '/api/explore',
  '/api/rankings',
  '/api/library',
  '/api/user/data',
  '/api/achievements',
  '/api/notifications',
];

function isCacheableAPI(pathname) {
  return CACHEABLE_API_PATHS.some(prefix => pathname.startsWith(prefix));
}

// Estrategia: NetworkFirst para APIs (con caché selectiva)
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && isCacheableAPI(new URL(request.url).pathname)) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      await trimCache(API_CACHE, MAX_API_CACHE);
    }
    
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    
    if (cached) {
      // Añadir header indicando que es datos cacheados
      const headers = new Headers(cached.headers);
      headers.set('X-Cache-Status', 'HIT');
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    
    // Retornar error JSON para APIs
    return new Response(
      JSON.stringify({ error: 'Offline - No cached data available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Estrategia: CacheFirst para fonts
async function handleFontRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('', { status: 404 });
  }
}

// Estrategia: Cache con prioridad de red para App Shell
async function handleAppShellRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Intentar red primero
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Fallback a cache
    const cached = await cache.match(request);
    if (cached) return cached;
    
    // Fallback a página offline
    if (request.mode === 'navigate') {
      const cachedOffline = await cache.match('/offline');
      if (cachedOffline) {
        // Clonar la respuesta offline para no consumir el body
        const offlineClone = cachedOffline.clone();
        return offlineClone;
      }
      try {
        return await fetch('/offline');
      } catch {
        return new Response(
          '<!DOCTYPE html><html><head><title>Offline</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:20px}div{max-width:400px}h1{font-size:1.5rem;margin-bottom:1rem}p{color:#94a3b8;line-height:1.5}</style></head><body><div><h1>Sin conexión</h1><p>Parece que no tienes conexión a internet. Conéctate para seguir usando MangaAura.</p></div></body></html>',
          { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    }
    
    return new Response('Resource not available offline', { status: 404 });
  }
}

// Estrategia: NetworkFirst genérica
async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Not available offline', { status: 404 });
  }
}

// Background Sync para acciones pendientes
// El SW recibe el evento sync y lo reenvía a todas las páginas abiertas.
// La página es responsable de leer IndexedDB y hacer POST a /api/sync.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ type: 'SYNC_NOW' });
    }
  } catch (error) {
    console.error('[SW] Failed to notify clients for sync:', error);
    throw error;
  }
}

// Periodic sync para limpiar caches viejos

// Periodic sync para limpiar caches viejos
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cleanup-old-caches') {
    event.waitUntil(cleanupOldCaches());
  }
});

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = [STATIC_CACHE, IMAGE_CACHE, API_CACHE, FONT_CACHE, RUNTIME_CACHE];
  
  await Promise.all(
    cacheNames
      .filter(name => !validCaches.includes(name))
      .map(name => caches.delete(name))
  );
}

// Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.url || '/',
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Si hay una ventana abierta, navegar ahí
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Mensajes desde la página
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    const cacheName = event.data.cacheName;
    if (cacheName) {
      caches.delete(cacheName).then(() => {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'CACHE_CLEARED', cacheName });
          });
        });
      });
    }
  }
  
  if (event.data?.type === 'GET_CACHE_INFO') {
    Promise.all([
      caches.open(STATIC_CACHE).then(c => c.keys()),
      caches.open(IMAGE_CACHE).then(c => c.keys()),
      caches.open(API_CACHE).then(c => c.keys()),
    ]).then(([staticKeys, imageKeys, apiKeys]) => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_INFO',
            data: {
              static: staticKeys.length,
              images: imageKeys.length,
              api: apiKeys.length,
              total: staticKeys.length + imageKeys.length + apiKeys.length,
            },
          });
        });
      });
    });
  }
});
