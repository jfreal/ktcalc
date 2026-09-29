# Cutover runbook: ktcalc.com from Netlify to Cloudflare Workers

Status: **not cut over.** Netlify still serves ktcalc.com. The Worker `ktcalc`
builds from the same `build/` folder and runs side by side at
<https://ktcalc.john-e-farrell.workers.dev> until the flip below.

## Where things are today (checked 2026-09-29)

| Thing | Today |
| --- | --- |
| Registrar | Name.com (DNSSEC off) |
| Nameservers | Netlify DNS: `dns1.p07.nsone.net` … `dns4.p07.nsone.net` |
| DNS records | Only two, both Netlify-managed: `ktcalc.com` and `www.ktcalc.com` → `ktcalc.netlify.app`. No MX, no TXT. |
| TLS | Netlify's Let's Encrypt cert, expires 2026-11-21 |
| Redirects | `www` → apex (301), `http` → `https` (301), `/fight` → `/fight/` (301, pretty URLs) |
| Headers | `public/_headers` (works on both hosts) + Netlify's HSTS `max-age=31536000` |
| Netlify extras | No env vars, no functions, no forms (`ignore_html_forms`), no snippet injection, no plugins. Google Analytics is a plain `gtag` tag in `public/index.html`, so it moves as-is. |
| Cloudflare | Account `08c43dfd9f0fbb3a4a8be12328a94849`, Worker `ktcalc` on workers.dev. No `ktcalc.com` zone yet. |

A Workers route or Custom Domain needs the zone on Cloudflare, so the
nameservers have to move from Netlify DNS to Cloudflare. The plan below moves
DNS first while still pointing at Netlify (no visible change), then flips
traffic with one proxy toggle, which is also the rollback.

## Phase 0: deploy path (once)

Cloudflare Workers Builds builds and deploys straight from GitHub, so there is
no API token and no GitHub secret.

1. Cloudflare dashboard → **Workers & Pages** → **ktcalc** → **Settings** →
   **Builds** → **Connect**. Pick GitHub, install or allow the Cloudflare app
   for `jfreal/ktcalc`, and choose that repo. Connect this existing Worker
   rather than creating a new one: the Worker name must be `ktcalc`, the same
   as `name` in `wrangler.jsonc`, or every build fails.
2. Build settings:

   | Setting | Value |
   | --- | --- |
   | Git branch | `main` |
   | Root directory | `/` (leave empty) |
   | Build command | `npm run build:cloudflare` |
   | Deploy command | `npx wrangler deploy` |
   | Preview builds | **Enabled** |
   | Preview command | `npx wrangler preview` |

   The build command matters: plain `npm run build` keeps Netlify's
   `_redirects`, and Cloudflare rejects the deploy. No build variables are
   needed; the default Node 24 and `CI=true` build was tested locally.
3. Merge the Workers PR (or push any commit to main). Check the build under
   **Deployments → View build history** is green and
   <https://ktcalc.john-e-farrell.workers.dev> shows the new commit.
4. Open any PR and check Cloudflare comments a Preview URL on it.

If react-snap cannot start Chromium on Cloudflare's build machine, the build
log fails in the `postbuild` step. The fallback is a GitHub Actions workflow
running `wrangler deploy`. One is `.github/workflows/deploy.yml` at commit
`c3e19ad` (jfreal/ktcalc#81); its build passed on GitHub's runners, but its
deploy steps never ran. It needs `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` repo secrets.

Netlify keeps deploying main in parallel. Nothing user-visible changes yet.

## Phase 1: move DNS to Cloudflare, still pointing at Netlify

1. Cloudflare dashboard → **Add a domain** → `ktcalc.com` → Free plan →
   let it scan.
2. In **DNS → Records**, make the zone hold exactly these two records (delete
   anything else the scan imported):

   | Type | Name | Target | Proxy |
   | --- | --- | --- | --- |
   | CNAME | `ktcalc.com` | `ktcalc.netlify.app` | **DNS only** (grey) |
   | CNAME | `www` | `ktcalc.netlify.app` | **DNS only** (grey) |

   Grey means Cloudflare only answers DNS; Netlify still serves and keeps its
   own certificate.
3. **SSL/TLS → Overview**: set mode to **Full (strict)**.
   **SSL/TLS → Edge Certificates**: turn on **Always Use HTTPS**, and enable
   **HSTS** with max-age 12 months, *includeSubDomains off*, *preload off*
   (matches Netlify's current header).
4. Name.com → ktcalc.com → **Nameservers** → replace the four `nsone.net`
   servers with the two Cloudflare shows on the zone overview page. Do not
   touch the Netlify DNS zone; resolvers that still cache the old nameservers
   (up to 48 hours) keep getting the same Netlify answer from it.
5. Wait until the Cloudflare zone says **Active** and **SSL/TLS → Edge
   Certificates** shows the Universal certificate as **Active** for
   `ktcalc.com, *.ktcalc.com`. Then wait out the 48-hour nameserver TTL.

Nothing user-visible changes in this phase, because both nameserver sets
answer "Netlify".

## Phase 2: the flip

1. **Add the routes to the Worker.** Merge a small PR that adds this to
   `wrangler.jsonc`, and let the Workers Build for it go green:

   ```jsonc
   "routes": [
     { "pattern": "ktcalc.com/*", "zone_name": "ktcalc.com" }
   ]
   ```

   The route does nothing yet, because routes only run on proxied (orange)
   records and the record is still grey.
2. **www redirect.** Cloudflare → ktcalc.com → **Rules → Redirect Rules** →
   Create from template **Redirect from WWW to root** → status 301, preserve
   query string → Deploy.
3. **Flip.** DNS → Records → set both CNAMEs to **Proxied** (orange). From now
   on Cloudflare answers `ktcalc.com` with the Worker, and `www` with the 301.
   Netlify's origin is no longer reached.
4. **Check** (a private window avoids cached pages):
   - `https://ktcalc.com/` loads; response header `server: cloudflare`, no
     `x-nf-request-id`.
   - `/fight` → `/fight/`, `/help/`, `/rules/combat/`, `/notes/punishing/`
     each show their own title. A made-up path shows the calculator.
   - `https://www.ktcalc.com/fight/` → 301 to `https://ktcalc.com/fight/`.
   - `http://ktcalc.com/` → 301 to https.
   - Google Analytics realtime still shows visits.

## Rollback

DNS → Records → set both CNAMEs back to **DNS only** (grey). Traffic goes to
Netlify again within about 5 minutes (proxied records have a 300 s TTL). This
works as long as the Netlify site is still published and its certificate is
valid (expires 2026-11-21; Netlify may not renew it while the records are
proxied). The Worker route can stay; it is inert on grey records.

## After the flip: switch off Netlify

Do these once the site has been good on Cloudflare for a day or two:

1. Netlify → site **ktcalc** → Site configuration → Build & deploy →
   Continuous deployment → Build settings → **Configure** → **Stop builds** →
   Save. This stops every production, deploy-preview and branch build, so no
   more credits are spent. The last deploy stays published for rollback.
2. Later, optional, once rollback is no longer wanted: remove `ktcalc.com`
   from the Netlify site's domains, delete the Netlify DNS zone for
   ktcalc.com, and delete `public/_redirects` and `scripts/strip-netlify-redirects.js`
   (switch the Workers Builds build command to `npm run build`).

## Notes

- Cost: the Worker has no script, only static assets. Static asset requests
  are free and unlimited on the Workers Free plan, so a deploy costs nothing
  and every merge to main still goes live right away.
- Known differences from Netlify, all harmless: trailing-slash redirects are
  `307` instead of `301` (the sitemap and canonicals already use the slash
  form); `/index.html` redirects to `/`; a missing file under `/rules/` or
  `/static/` returns `index.html` with `200`, exactly as Netlify's `/*` rule
  does today.
