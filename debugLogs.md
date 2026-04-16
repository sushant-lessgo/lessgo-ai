⨯ PrismaClientKnownRequestError: 
Invalid `prisma.publishedPage.findUnique()` invocation:


The column `PublishedPage.customDomain` does not exist in the current database.
    at Zn.handleRequestError (/var/task/node_modules/@prisma/client/runtime/library.js:121:7459)
    at Zn.handleAndLogRequestError (/var/task/node_modules/@prisma/client/runtime/library.js:121:6784)
    at Zn.request (/var/task/node_modules/@prisma/client/runtime/library.js:121:6491)
    at async l (/var/task/node_modules/@prisma/client/runtime/library.js:130:9778)
    at async D (/var/task/.next/server/app/api/domains/status/route.js:1:1551)
    at async /var/task/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:38411
    at async e_.execute (/var/task/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:27880)
    at async e_.handle (/var/task/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:39943)
    at async en (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:25561)
    at async ea.responseCache.get.routeKind (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:1028) {
  code: 'P2022',
  meta: { modelName: 'PublishedPage', column: 'PublishedPage.customDomain' },
  clientVersion: '6.8.2'
}