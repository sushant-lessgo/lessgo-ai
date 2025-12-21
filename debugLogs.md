🔴 [UPLOAD] Image upload error: Error: ENOENT: no such file or directory, mkdir '/var/task/public/uploads/e205C_rZ8jmP'
    at async mkdir (node:internal/fs/promises:860:10)
    at async h (/var/task/.next/server/app/api/upload-image/route.js:1:2409)
    at async /var/task/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:38411
    at async e_.execute (/var/task/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:27880)
    at async e_.handle (/var/task/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:39943)
    at async en (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:25561)
    at async ea.responseCache.get.routeKind (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:1028)
    at async r9.renderToResponseWithComponentsImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:508)
    at async r9.renderPageComponent (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:5102)
    at async r9.renderToResponseImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:5680) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'mkdir',
  path: '/var/task/public/uploads/e205C_rZ8jmP'
}