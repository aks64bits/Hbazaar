const CACHE_NAME = 'hbazaar-v1';
const ASSETS = [
    './',
    './index.html',
    './shop.html',
    './checkout.html',
    './orders.html',
    './order-success.html',
    './login.html',
    './register.html',
    './profile.html',
    './about.html',
    './terms.html',
    './privacy.html',
    './css/style.css',
    './js/app.js',
    './js/db.js',
    // External fonts/icons usually best left to browser cache or specific runtime caching strategies
    // but we can try to cache them if we want truly offline (requires CORS handling often)
];

// Install Event
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installed');
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all assets');
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event
self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Activated');
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch Event - Network First for HTML, Cache First for assets could be better, 
// but for simplicity we'll use a Stale-While-Revalidate or Network-First approach.
// Given this is a demo/dev env, Network First is often safer to see changes immediately.

self.addEventListener('fetch', (e) => {
    // Network First strategy
    e.respondWith(
        fetch(e.request)
            .then((res) => {
                // Determine if we should cache this new response
                // Only cache valid responses (basic check)
                if (!res || res.status !== 200 || res.type !== 'basic') {
                    return res;
                }

                const responseClone = res.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseClone);
                });

                return res;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(e.request);
            })
    );
});
