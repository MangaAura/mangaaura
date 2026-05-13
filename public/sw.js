/**
 * Service Worker para InkVerse PWA
 * 
 * Estrategias de cache:
 * - App Shell: CacheFirst
 * - Imágenes: CacheFirst con límite
 * - API: NetworkFirst con fallback a cache
 * - Fonts: CacheFirst
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `inkverse-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `inkverse-images-${CACHE_VERSION}`;
const API_CACHE = `inkverse-api-${CACHE_VERSION}`;

// App Shell - Recursos críticos para la app
const APP_SHELL = [
  '/',
  '/offline',
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

// Fetch: Estrategias de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
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

// Estrategia: CacheFirst para imágenes
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Refrescar cache en background
    fetch(request).then((response) => {
      cache.put(request, response.clone());
    }).catch(() => {});
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Fallback a placeholder
    return new Response('Image not available offline', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Estrategia: NetworkFirst para APIs
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
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

// Estrategia: NetworkFirst para App Shell
async function handleAppShellRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    
    // Fallback a página offline
    if (request.mode === 'navigate') {
      return cache.match('/offline') || Response.redirect('/offline', 302);
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
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  try {
    // Enviar mensaje a la página para que sincronice
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({ type: 'SYNC_NOW' });
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
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
});
