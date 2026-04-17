                                                                                          
● Custom domains (Phase A+B) are live in production and end-to-end verified on a real customer domain    
  (kundiusphotography.com). Full flow works: add domain → TXT ownership check → DNS verification → live  
  state → custom domain serves the landing page, subdomain 301-redirects to it, remove cleanly rolls     
  back. Currently serving via the SSR fallback path (/p/{slug} rendering dynamically from Postgres) —    
  both subdomains and custom domains take this route. Separately, we discovered a pre-existing bug in the
   static-export-to-blob pipeline (React "Element type is invalid" error, likely a broken UIBlock import)
   that has been silently failing for all publishes since before this feature. It does not affect        
  user-visible functionality — SSR serves identical content — but it means every page load hits the DB
  and renders on-the-fly instead of streaming a pre-baked HTML blob from CDN. Low-impact at current
  traffic; worth fixing before any marketing push or scale event, as the blob path is significantly
  faster and reduces DB load. Recommend shipping custom domains as-is and scheduling static-export
  debugging as a separate ticket.