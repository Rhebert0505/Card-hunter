# Card Hunter

Static Card Hunter website targeting the existing Cloudflare Worker `summer-glitter-5d84`.

## Cloudflare build settings

- Repository: `Rhebert0505/Card-hunter`
- Production branch: `main`
- Root: repository root
- Build command: leave empty
- Deploy command: `npx wrangler@4 deploy`

Connect the existing Worker in Settings > Builds > Connect. The Worker name in wrangler.jsonc must remain summer-glitter-5d84. Do not modify TIFMAS.

The files in public/ are from the existing Card Hunter v2 export. Product data is a snapshot, not live synchronized.

Automatic deployment is not yet verified. After connecting Cloudflare, push a commit to main and confirm an automatic successful production deployment for that exact commit at the existing website address.
