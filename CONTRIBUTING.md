# Contributing

Thanks for helping build a high-fidelity Ableton-style control kit for the web.

## Ground rules

1. **No proprietary assets.** Never commit Ableton/Cycling '74 image files, fonts, or binary themes. All visuals must be original SVG/CSS. See [docs/FIDELITY.md](docs/FIDELITY.md).
2. **Framework-agnostic.** Components are standard Custom Elements (Lit). No React/Vue-only APIs in the core package.
3. **Fidelity is the bar.** A control isn't done until it matches native Live side-by-side and follows the [behavioral conventions](docs/FIDELITY.md#behavioral-conventions-live-parity).

## Dev setup

```bash
npm install
npm run dev         # quick demo page
npm run dev:demo    # the full playground (also deployed to GitHub Pages)
npm run storybook   # component explorer
npm run typecheck
npm run build
```

## Adding a control

1. Create `src/components/able-<name>.ts` (copy `able-dial.ts` as a template).
2. Drive all colors/geometry from `--able-*` theme variables — add new ones to `src/theme.css` only when needed, named to mirror Live's `.ask` keys.
3. Emit `input` (continuous) and `change` (commit) `CustomEvent`s with `{ detail: { value } }`, `bubbles: true, composed: true`.
4. Add ARIA (`role`, `aria-value*`) and keyboard support.
5. Export it from `src/index.ts`.
6. Add a `*.stories.ts` file.
7. Update the component table in the README.

## Roadmap (control priority)

**Phase 1:** dial ✅ · slider (h/v) · toggle/button · numeric value box · enum dropdown
**Phase 2:** XY pad · range slider · meter/VU · breakpoint/envelope editor · step-sequencer grid
