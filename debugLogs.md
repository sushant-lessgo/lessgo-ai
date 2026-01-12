2026-01-12 16:30:37.296 [error] [Middleware] Checking KV: { host: 'page3.lessgo.ai', path: '/' }
2026-01-12 16:30:37.317 [error] [Middleware] KV result: { routeKey: 'route:page3.lessgo.ai:/', found: true }
2026-01-12 16:30:37.317 [error] [Middleware] Rewriting to blob proxy: route:page3.lessgo.ai:/
2026-01-12 16:30:37.356 [error] [Blob Proxy] Received request: { routeKey: 'route:page3.lessgo.ai:/' }
2026-01-12 16:30:37.373 [error] [Blob Proxy] KV lookup result: { route: 'found', hasUrl: false, blobUrl: undefined }
2026-01-12 16:30:37.375 [error] [Blob Proxy] Returning 404 - route not found