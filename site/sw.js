/* MiniGodotCourse service worker — offline cache.
   Bump CACHE_VERSION whenever the course content changes, so installed apps
   pick up the new version. */
const CACHE_VERSION = 'v60-2';
const CACHE_NAME = 'minigodotcourse-' + CACHE_VERSION;

/* Only same-origin assets are cached. The Groq API call is deliberately NOT
   cached — it needs the network and the student's own API key. */
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './404.html'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.map(function(n){
        if(n !== CACHE_NAME) return caches.delete(n);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  const url = new URL(e.request.url);

  /* Never intercept the Groq API — it must go to the network. */
  if(url.hostname === 'api.groq.com') return;

  /* Only handle same-origin GET requests. */
  if(e.request.method !== 'GET') return;
  if(url.origin !== self.location.origin) return;

  /* Cache-first for our own assets: offline by default. */
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        /* Cache same-origin successes so future loads work offline. */
        if(res && res.status === 200 && (url.origin === self.location.origin)){
          const clone = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
        }
        return res;
      }).catch(function(){
        /* Offline and not cached: send the app shell so the page still opens. */
        if(e.request.mode === 'navigate'){
          return caches.match('./index.html');
        }
        return new Response('', {status: 503, statusText: 'Offline'});
      });
    })
  );
});
