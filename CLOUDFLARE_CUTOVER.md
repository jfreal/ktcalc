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

1. **Create the API token.** Cloudflare dashboard → My Profile → API Tokens →
   Create Token → template **Edit Cloudflare Workers** → Account Resources:
   *John.e.farrell@gmail.com's Account* → Zone Resources: *All zones from an
   account* (it must cover ktcalc.com once the zone exists) → Create. Copy it.
2. **Add two repo secrets** in GitHub → jfreal/ktcalc → Settings → Secrets and
   variables → Actions → New repository secret:
   - `CLOUDFLARE_API_TOKEN` = the token from step 1
   - `CLOUDFLARE_ACCOUNT_ID` = `08c43dfd9f0fbb3a4a8be12328a94849`
3. Merge the Workers PR. The `deploy` workflow builds and runs `wrangler deploy`
   on every push to main. Check the run is green and
   <https://ktcalc.john-e-farrell.workers.dev> shows the new commit.
4. Open any PR and check the `deploy` run comments a `pr-<number>` Preview URL.
   If the Preview step fails with a permissions error, edit the token and add
   the missing permission it names.

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
   `wrangler.jsonc`, and let the `deploy` workflow go green:

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
   (switch the workflow's build to `npm run build`).

## Notes

- Cost: the Worker has no script, only static assets. Static asset requests
  are free and unlimited on the Workers Free plan, so a deploy costs nothing
  and every merge to main still goes live right away.
- Known differences from Netlify, all harmless: trailing-slash redirects are
  `307` instead of `301` (the sitemap and canonicals already use the slash
  form); `/index.html` redirects to `/`; a missing file under `/rules/` or
  `/static/` returns `index.html` with `200`, exactly as Netlify's `/*` rule
  does today.
