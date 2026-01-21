# Domain to Vercel (mytayp.com + www)

## Vercel setup
1) Open the Vercel project for the dashboard-admin app.
2) Go to Settings -> Domains.
3) Add `mytayp.com` and `www.mytayp.com`.
4) Keep the project root pinned to `dashboard-admin` (see `vercel.json`).

## Registrar DNS
Use the DNS values shown in Vercel. Typical setup:
- Apex (mytayp.com): A record to the Vercel IP shown in the UI.
- www: CNAME to `cname.vercel-dns.com` (or the exact value Vercel provides).

## Notes
- DNS changes can take a few minutes to propagate.
- If you only want the apex domain, skip `www`.
