const CACHE_NAME = 'imuno-defesa-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/game.js',
    './js/player.js',
    './js/enemy.js',
    './js/projectile.js',
    './js/particle.js',
    './js/upgrade.js',
    './js/progression.js',
    './js/achievements.js',
    './manifest.json',
    './assets/icon-192.png',
    './assets/icon-512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching all assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

// Interceptação de requisições (Offline-first)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then((response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Se falhar (offline) e não estiver no cache, retorna uma página offline se tiver
                        // Para jogos single page, geralmente o cache hit resolve
                    });
            })
    );
});
