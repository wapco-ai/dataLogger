// service-worker.js

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('static-v1').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/css/style.css',
                '/js/app.js',
                '/js/sensors.js',
                '/js/storage.js',
                '/vendor/jquery/jquery.min.js',
                '/vendor/leaflet/leaflet.js',
                '/vendor/leaflet/leaflet.css'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
}); 
