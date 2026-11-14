# Card Hunter

Static Card Hunter website targeting the existing Cloudflare Worker `summer-glitter-5d84`.

## Automatic deployment

`.github/workflows/deploy.yml` runs on every push to `main` and can also be started manually. It validates the Worker name and deploys only `summer-glitter-5d84` with Cloudflare's official Wrangler action.

### One-time account authorization

Create a Cloudflare API token with Workers Editor access scoped only to the existing `summer-glitter-5d84` Worker. This token should not grant access to the TIFMAS Worker or permission to create/delete Workers. Do not add route or DNS permissions for the existing workers.dev address.

In this repository, open Settings > Secrets and variables > Actions and add these repository secrets:

- `CLOUDFLARE_API_TOKEN`: the Cloudflare deployment token.
- `CLOUDFLARE_ACCOUNT_ID`: the account ID containing `summer-glitter-5d84`.

Enter credentials directly into GitHub's secret fields. Do not commit token values or paste them into chat.

### Status and verification

The workflow has been committed. Successful Cloudflare deployment is NOT yet verified; the workflow requires the two account secrets above.

After the secrets are saved, push a commit to main. Confirm that a workflow run starts automatically for that exact commit, completes successfully, and the existing Card Hunter address serves the application. Record the URL from the deployment output. This updates the existing Worker rather than creating a new site.

## Application

The unchanged files in public/ are from the Card Hunter v2 export. Product data is a snapshot, not live synchronized. The Worker name in wrangler.jsonc must remain summer-glitter-5d84.

Do not modify TIFMAS.

Deployment runs are serialized so pushes cannot deploy simultaneously. The checkout and Cloudflare actions are pinned to reviewed commits.
