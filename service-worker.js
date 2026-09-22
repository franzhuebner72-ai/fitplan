 javascript
const CACHE_NAME = "fitplan-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {

  const url = new URL(event.request.url);

  /*
   * OpenFoodFacts NICHT über den Cache laden.
   * Dadurch funktioniert die Lebensmittelsuche
   * mit dem Internet.
   */
  if (
    url.hostname.includes("openfoodfacts.org")
  ) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({
products: []
            }),
            {
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
        })
    );

    return;
  }

  /*
   * Normale App-Dateien:
   * zuerst Cache verwenden,
   * bei fehlender Datei Internet versuchen.
   */
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {

            /*
             * Erfolgreiche lokale Dateien
             * in den Cache übernehmen.
             */
            if (
              response &&
              response.status === 200 &&
              response.type === "basic"
            ) {
              const responseClone =
                response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(
                    event.request,
                    responseClone
                  );
                });
            }

            return response;

          })
          .catch(() => {

            return caches.match(
              "./index.html"
            );

          });

      })
  );

});
