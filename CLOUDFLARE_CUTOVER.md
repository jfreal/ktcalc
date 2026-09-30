# Cutover runbook: ktcalc.com from Netlify to Cloudflare Workers

Status: **cut over on 2026-09-30.** Cloudflare serves ktcalc.com from the
Worker `ktcalc` (Workers Builds deploys every push to main). The Netlify site
is paused and kept only as the rollback (see the end of this file).

## Now (checked 2026-09-30)

| Thing | Now |
| --- | --- |
| Nameservers | Cloudflare: `ashton.ns.cloudflare.com`, `jacqueline.ns.cloudflare.com` (set at Name.com) |
| `ktcalc.com` | Workers **Custom Domain** on the Worker `ktcalc`. Cloudflare owns its record (`AAAA 100::`, proxied) and certificate. Listed in `wrangler.jsonc` `routes`, so deploys keep it. |
| `www.ktcalc.com` | `A 192.0.2.1`, proxied (a placeholder: requests never reach it) + Redirect Rule "Redirect from WWW to root" (301, keeps path and query) |
| `http://` | Redirect Rule "Redirect from HTTP to HTTPS" (301) |
| HSTS | **Enabled** (SSL/TLS → Edge Certificates → HSTS): max-age 12 months, include subdomains off, preload off, No-Sniff on. Live header `Strict-Transport-Security: max-age=31536000`, the same as Netlify sent. |
| Netlify | **Paused** by hand on 2026-09-30 (`disabled: true`, "Manually paused by user"). No builds, no credits; `ktcalc.netlify.app` returns 404. Last deploy kept: `6abcfa6d`, 2026-09-30 12:02 UTC (the #81 merge). |

The rest of this file is the plan as written before the cutover, then the
rollback and the Netlify switch-off.

## Before the cutover (checked 2026-09-29)

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

   The build command matters. Plain `npm run build` runs react-snap, which
   needs Chromium, and Cloudflare's build machine can't start it (missing
   `libXcomposite.so.1`). It also keeps Netlify's `_redirects`, which
   Cloudflare rejects. `build:cloudflare` prerenders with
   `scripts/prerender.js` (jsdom, no browser) and drops `_redirects`.
3. Optional, makes each build a little faster: add the build variable
   `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` = `true` (Settings → Build → Build
   variables and secrets). It stops `npm ci` downloading react-snap's
   Chromium, which the Cloudflare build never uses.
4. Merge the Workers PR (or push any commit to main). Check the build under
   **Deployments → View build history** is green and
   <https://ktcalc.john-e-farrell.workers.dev> shows the new commit.
5. Open any PR and check Cloudflare comments a Preview URL on it.

If the prerender ever fails on Cloudflare, the build log names the route and
the page error. The fallback is a GitHub Actions workflow running react-snap
and `wrangler deploy`. One is `.github/workflows/deploy.yml` at commit
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

## Phase 2: the flip (as done on 2026-09-30)

The plan was a `ktcalc.com/*` route plus a grey-to-orange toggle on CNAMEs to
Netlify. The cutover used a Workers **Custom Domain** instead, which is the
recommended setup when the Worker is the whole site:

1. Workers & Pages → **ktcalc** → Settings → Domains & Routes → Add →
   **Custom domain** → `ktcalc.com`. Cloudflare replaced the apex record with
   its own proxied record and issued the certificate.
2. **www redirect.** ktcalc.com → **Rules → Redirect Rules** → template
   **Redirect from WWW to root** → 301 → in the "may not apply" dialog pick
   **Create a new proxied DNS record**: `A`, `www`, `192.0.2.1`.
3. `wrangler.jsonc` lists the domain under `routes` with `custom_domain: true`,
   so `wrangler deploy` (which treats the config file as the source of truth
   for routes) never drops it.
4. **Checked** on 2026-09-30: `/`, `/fight/`, `/rules/combat/` 200 from
   Cloudflare with their own titles; a made-up path shows the calculator;
   `/rules/COMBAT_RULES.md` 200; `www` → 301 to the same path on ktcalc.com
   (query kept); `http://` → 301 to https.

## Rollback

Works while Netlify still has the site and its certificate is valid (expires
2026-11-21; Netlify renews it once traffic reaches it again). The Netlify site
is **paused**, so un-pause it first:

0. Netlify → site **ktcalc** → un-pause (resume) the site, and check that
   <https://ktcalc.netlify.app/> loads the calculator instead of a 404. It
   serves the last Netlify deploy (2026-09-30 12:02 UTC); anything merged
   since then only exists on Cloudflare.

1. Workers & Pages → **ktcalc** → Settings → Domains & Routes → remove the
   `ktcalc.com` Custom Domain. This also deletes its DNS record.
2. ktcalc.com → DNS → Records:
   - Add `CNAME ktcalc.com → ktcalc.netlify.app`, **DNS only** (grey).
   - Edit `www`: delete the `A 192.0.2.1` record, add
     `CNAME www → ktcalc.netlify.app`, **DNS only** (grey). The www Redirect
     Rule stops applying on its own (it only runs on proxied records), and
     Netlify redirects www to the apex as before.
3. Traffic reaches Netlify within minutes. Check in a private window that
   <https://ktcalc.com/> loads the calculator over https with no certificate
   warning, and that `www.ktcalc.com` redirects to it. Only then treat the
   rollback as done.
4. Before the next merge to main, remove the `routes` entry from
   `wrangler.jsonc` (or disconnect Workers Builds). Otherwise the next deploy
   re-attaches the Custom Domain, which fails while the CNAME exists.

## After the flip: switch off Netlify

Do these once the site has been good on Cloudflare for a day or two:

1. **Done 2026-09-30, by pausing the whole site** instead of Stop builds.
   Pausing also stops every production, deploy-preview and branch build (no
   Netlify build ran for the #82 and #83 merges), and it takes
   `ktcalc.netlify.app` offline, which is why the rollback now starts with
   un-pausing. The lighter option, if an instant rollback is ever wanted
   again: un-pause, then Project configuration → Developer settings →
   Continuous deployment → Build settings → **Configure** → set **Build
   status** to **Stopped builds** → Save.
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
- Prerender differences from react-snap, checked on all 12 routes: titles,
  descriptions, og tags, canonicals, h1s and every form control's saved value
  are identical. The page text keeps the spaces react-snap's minifier drops,
  and the fight page's chart is saved as an empty box (jsdom has no layout);
  the browser draws it on load, as before.
- After cutover, Netlify's react-snap step can go: point `build` at
  `scripts/prerender.js` and remove `react-snap` from `package.json`.
