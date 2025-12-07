18:56:17.659 Running build in Washington, D.C., USA (East) – iad1
18:56:17.660 Build machine configuration: 2 cores, 8 GB
18:56:17.913 Cloning github.com/sushant-lessgo/lessgo-ai (Branch: main, Commit: c7cc2d2)
18:56:20.804 Cloning completed: 2.890s
18:56:21.006 Restored build cache from previous deployment (CZb7zGmThHdTJ4vcaT6TQpQDFroZ)
18:56:21.206 Running "if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi"
18:56:21.860 Running "vercel build"
18:56:22.356 Vercel CLI 49.0.0
18:56:22.732 Installing dependencies...
18:56:24.473 
18:56:24.473 > lessgo@0.1.0 postinstall
18:56:24.474 > prisma generate && prisma migrate deploy
18:56:24.474 
18:56:25.206 Prisma schema loaded from prisma/schema.prisma
18:56:25.670 
18:56:25.671 ✔ Generated Prisma Client (v6.8.2) to ./node_modules/@prisma/client in 317ms
18:56:25.672 
18:56:25.672 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
18:56:25.672 
18:56:25.672 Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate
18:56:25.672 
18:56:26.377 Prisma schema loaded from prisma/schema.prisma
18:56:26.394 Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-muddy-thunder-a206x06r-pooler.eu-central-1.aws.neon.tech"
18:56:27.848 
18:56:27.849 10 migrations found in prisma/migrations
18:56:27.849 
18:56:29.545 Applying migration `20251206181337_sprint8_baseline`
18:56:29.848 Error: P3018
18:56:29.849 
18:56:29.849 A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve
18:56:29.849 
18:56:29.850 Migration name: 20251206181337_sprint8_baseline
18:56:29.850 
18:56:29.850 Database error code: 42P07
18:56:29.850 
18:56:29.850 Database error:
18:56:29.850 ERROR: relation "User" already exists
18:56:29.850 
18:56:29.850 DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \"User\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1160), routine: Some("heap_create_with_catalog") }
18:56:29.850 
18:56:29.851 
18:56:29.861 npm error code 1
18:56:29.862 npm error path /vercel/path0
18:56:29.862 npm error command failed
18:56:29.862 npm error command sh -c prisma generate && prisma migrate deploy
18:56:29.865 npm error A complete log of this run can be found in: /vercel/.npm/_logs/2025-12-07T17_56_22_957Z-debug-0.log
18:56:29.899 Error: Command "npm install" exited with 1