# Kill Team 2024 Calculator ("ktcalc")
Calculator for helping analyze shooting and fighting attacks in Kill Team 2024.

Live at [ktcalc.com](https://ktcalc.com/).
This project was forked from [https://github.com/jmegner/KT21Calculator](https://github.com/jmegner/KT21Calculator).

I took this project over because I wanted to do Vespid weapon math and needed a matrix to compare situations against different defensive profiles. I play on keeping ktcalc up to date throughout the edition and add features as requested.


## Dev Stuff
Basically, this is a React SPA web app mostly written in TypeScript.
Every push to main is built and deployed automatically. I do my development in VsCode but I'm mostly vibe coding along.

Contributions, human or robot, are welcome!

Dev setup...
- You'll need to install [NodeJS+npm](https://nodejs.org/en/) for building and running.
- For debugging and otherwise having a nice experience, this project is set up for vscode as the IDE.
- Initially, you'll have to do a `npm ci` to install npm packages with exact versions of previous development.
- Do a `npm run build` to build the React app and prerender the public routes.
- Do a `npm start` to build the TypeScript stuff and run.
- For debugging non-tests with vscode, be sure to do `npm start` before launching the debugger.
  For debugging tests, you can just launch one of vscode's test-oriented debug profiles.
- To run tests, do `npm test` for normal watch-mode testing that sticks around.
  Do `npm run testq` for a single run of tests (like doing `test` and then hitting `q` to quit). CI runs `npm run testq` on pull requests and on pushes to main.

Deploying...
- Netlify serves ktcalc.com today. It builds main with `npm run build:react` and publishes `build/` (settings live in the Netlify UI; `public/_redirects` and `public/_headers` are its routing and headers).
- Cloudflare Workers runs side by side until the DNS cutover. Cloudflare Workers Builds is connected to this repo in the Cloudflare dashboard: every push to main runs `npm run build:cloudflare` and `npx wrangler deploy` (live at https://ktcalc.john-e-farrell.workers.dev), and every pull request gets a Preview URL posted as a comment. `wrangler.jsonc` is the config; the build settings live in the Cloudflare dashboard. No GitHub secrets are needed.
- To try the Workers build locally: `npm run build:cloudflare`, then `npx wrangler dev`.
- The cutover steps, rollback, and Netlify switch-off are in [CLOUDFLARE_CUTOVER.md](CLOUDFLARE_CUTOVER.md).
