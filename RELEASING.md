# Releasing

How to publish `ableton-web-components` to npm and deploy the demo site.

## npm publish

The package is published from CI on a version tag. Local `npm publish` also works.

### One-time setup

1. **Create an npm automation token** — npmjs.com → _Access Tokens_ → _Generate New Token_ → **Automation**.
2. **Add it as a repo secret** — GitHub repo → _Settings → Secrets and variables → Actions → New repository secret_ → name `NPM_TOKEN`, paste the token.
3. The package name `ableton-web-components` is currently unclaimed on npm — the first publish from this account claims it. `publishConfig`/`--access public` keeps it public (it's an unscoped name, so it's public by default).

### Cut a release

```bash
# make sure the tree is clean and on master
npm run typecheck
npm run build          # sanity-check the build locally (CI repeats this)

npm version patch      # or `minor` / `major` — bumps package.json + creates a git tag
git push --follow-tags # pushes the commit AND the vX.Y.Z tag
```

Pushing the `v*` tag triggers [`.github/workflows/publish.yml`](.github/workflows/publish.yml), which runs `npm ci`, `typecheck`, then `npm publish --access public --provenance`. `prepublishOnly` (in `package.json`) runs the full `build` so `dist/` is always freshly compiled — `dist/` is gitignored and never committed.

`--provenance` attaches a [verifiable build attestation](https://docs.npmjs.com/generating-provenance-statements); it requires the `id-token: write` permission already set in the workflow.

### Publish locally instead (optional)

```bash
npm login
npm publish --access public
```

`prepublishOnly` builds first, so you don't need a manual `npm run build`.

### What ships

`package.json` `files` is `["dist", "src"]` — consumers get the compiled ESM + types in `dist/` and the original sources. To preview the exact tarball without publishing:

```bash
npm pack --dry-run
```

## Demo site (GitHub Pages)

The playground at <https://ben-juodvalkis.github.io/ableton-web-components/> is built from [`demo/index.html`](demo/index.html) and deployed by [`.github/workflows/pages.yml`](.github/workflows/pages.yml) on every push to `master`.

### One-time setup

GitHub repo → _Settings → Pages → Build and deployment → Source_ → **GitHub Actions**.

(The base path is `/ableton-web-components/`, set in [`vite.demo.config.ts`](vite.demo.config.ts). If the repo is ever renamed, update `base` to match, plus the `homepage` field in `package.json` and the playground links in the README.)

### Build it locally

```bash
npm run dev:demo     # http://localhost:5173/ableton-web-components/
npm run build:demo   # static output -> site/  (gitignored)
```
