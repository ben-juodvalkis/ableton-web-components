# CLAUDE.md

Guidance for working in this repo. Covers conventions that aren't obvious from the
code alone — especially the security-hardening rules to uphold over time.

## What this is

A small, framework-agnostic web-component library (Lit) of Ableton Live-style UI
controls. No server, no auth, no data handling. The published package is `dist/` +
runtime `src/`; everything else is dev/demo tooling.

- Components: `src/components/*.ts` (Lit elements, e.g. `able-dial`)
- Entry: `src/index.ts` (side-effect registers all `<able-*>` elements)
- Theme tokens: `src/theme.css` (`--able-*` vars mirroring Live's `.ask` keys)
- Demo/playground: `demo/` → built to `site/` → GitHub Pages
- Theme data: `scripts/build-themes.mjs` (dev-only; reads local Live `.ask` files)

## Security conventions (keep these intact)

A full pre-release security review was done at v0.1.0 — clean. Future reviews only
need to cover the diff. The rules below are what kept it clean; don't regress them.

### Components — no raw DOM sinks
- Render **only** through Lit `html`/`svg` tagged templates. They auto-escape
  interpolated values, so user-controllable attributes (`label`, `unit`, `value`,
  etc.) are safe as text bindings.
- **Never** introduce `innerHTML`, `unsafeHTML`, `eval`, `new Function`, or
  `insertAdjacentHTML`. If a new component seems to need one, stop and reconsider.
- Passing a string to `element.style.setProperty(name, value)` is fine — it's a
  value sink, not a parser (this is how `accent` is applied in `able-dial`).
- When adding a component, the review focus is: any new **non-template DOM sink**,
  and any new **network or file I/O**. The existing surfaces are already cleared.

### GitHub Actions — pin to commit SHAs
Both workflows (`.github/workflows/publish.yml`, `pages.yml`) pin every `uses:` to
an immutable 40-char commit SHA with the version in a trailing comment:

```yaml
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
```

**When adding or bumping an action**, resolve the tag to a SHA first — never commit
a bare `@v4` tag (a moved/compromised tag could inject code into the publish step,
which holds `NPM_TOKEN`). Resolve with:

```sh
gh api repos/<owner>/<repo>/commits/<tag> --jq '.sha'   # commit SHA to pin
```

To keep pins current despite this (SHA pinning disables auto patch updates), add a
`github-actions` Dependabot config — it updates both the SHA and the comment. Not
yet added; offer it if the user wants automated bumps.

### CI permissions stay least-privilege
- `publish.yml`: `contents: read` + `id-token: write` (for npm provenance). The
  `NPM_TOKEN` secret is scoped to the single `npm publish` step. Keep it that way.
- `pages.yml`: `contents: read`, `pages: write`, `id-token: write`.
- Never add `pull_request_target`, and never interpolate untrusted input
  (`github.event.*` from forks, PR titles/bodies) into `run:` blocks — that's a
  script-injection vector.

### npm package hygiene
- The `files` allowlist in `package.json` scopes the tarball. Stories are excluded
  via a negation pattern: `"!src/**/*.stories.ts"`. **Prefer `!`-negation in
  `files` over `.npmignore`** — when an explicit `files` array is present, npm
  honors it over `.npmignore`, so `.npmignore` subtractions are silently ignored.
- After any packaging change, verify what actually ships:
  ```sh
  npm pack --dry-run
  ```
  Confirm no stray local files, no `node_modules`, no test/story files, and that
  `dist/` + runtime `src/` are all present.
- `npm publish` uses `--provenance` (set in CI and `publishConfig`). Keep it.

### Secrets
- No secrets, tokens, `.env`, `.npmrc`, or keys belong in the repo. The only
  legitimate secret reference is `secrets.NPM_TOKEN` in `publish.yml`.

## Build / dev commands

```sh
npm run dev          # quick demo at localhost:5173
npm run dev:demo     # the GitHub Pages playground locally
npm run build        # library -> dist/ (vite + tsc)
npm run build:themes # regenerate demo/public/themes.json from a local Live install (dev-only)
npm run typecheck
npm run storybook
```

Releasing to npm + deploying the site is documented in `RELEASING.md`.

## Theme data note
`scripts/build-themes.mjs` only runs where Live is installed; it extracts **color
hex values only** (no binary assets, fonts, or theme files) into
`demo/public/themes.json`. Keep it that way — the "no redistributed Ableton assets"
stance is documented in `docs/FIDELITY.md` and matters legally.
