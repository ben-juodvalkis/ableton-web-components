# Fidelity & recreation process

The whole value of this project is that controls look **exactly** like native Ableton Live controls. "Close enough" is not the bar. This document describes how we achieve that legitimately — without redistributing any Ableton or Cycling '74 assets.

## The hard rule

**We never ship Ableton/Cycling '74 binary assets** (image files, the UI font, icon atlases, baked theme binaries). Doing so would be copyright infringement and would (rightly) get the project shut down — the opposite of becoming a trusted community resource.

What we *do* is a clean-room recreation: study the original, measure it, then author original SVG/CSS that happens to look identical. This is exactly how Max's own `live.dial` works — it's drawn procedurally, not stored as a bitmap — so vector recreation is the correct technique, not a workaround.

## What we can use (and why it's fine)

1. **Screenshots, for study.** Capturing native controls to measure geometry and sample colors is fair-use research. The screenshots themselves are **not** committed to the repo.
2. **`.ask` (Ableton Skin) theme files.** These are **plain-text, user-editable, officially-supported** theme files. Ableton encourages users to make and share skins. Reading the named color values out of a theme is reading public configuration, not extracting art. This gives us both the exact palette *and* the variable names we mirror as CSS custom properties. The playground's theme picker is built this way: [`scripts/build-themes.mjs`](../scripts/build-themes.mjs) reads only the color *values* for the keys we already map (no `.ask` files, fonts, or binaries are copied) and emits a small `themes.json`. It runs against a local Live install on a dev machine and is a no-op in CI — the committed JSON is the source of truth there.
3. **Runtime theme (best case).** Inside an Extension webview, prefer reading the host's active theme via the SDK where available, falling back to our recreated defaults.

## The per-control workflow

For each new control:

1. **Capture** native states at multiple zoom/DPI levels: default, hover, active/dragging, mapped, modulated, disabled.
2. **Measure** geometry — arc start angle and total sweep, stroke widths, indicator style (dot vs. line), corner radii, padding. Record these as theme variables (e.g. `--able-dial-arc-start`, `--able-dial-arc-sweep`) so they're tunable, not hardcoded.
3. **Sample** colors from the default `.ask` theme text and map them onto the existing `--able-*` tokens in [`src/theme.css`](../src/theme.css). Add new tokens only when a control genuinely needs one.
4. **Author** the control as original SVG/CSS in a Lit component.
5. **Diff** against the screenshot in a side-by-side fidelity page until it matches. (Planned: an automated pixel-diff harness in CI.)
6. **Verify behavior** matches Live conventions: vertical-drag, Shift = fine, double-click reset, keyboard, automation-friendly `input`/`change` events.

## Form-factor variants

Some controls ship in more than one stock shape (Max calls this the "Dial
Type"). `<able-dial>`'s `large` (default), `vertical`, and `tiny` variants share
**exactly the same geometry** — arc start/sweep, stroke widths, needle, triangle,
and bipolar fill are all expressed as fractions of the dial radius, so the only
measured difference is the **diameter** (vertical ≈ 0.6×, tiny ≈ 0.45× large). A
new variant of this kind therefore needs only its diameter ratio, not a fresh
round of geometry measurement.

The one layout difference is that `tiny` is too small to stack a value beneath
it, so — matching Live — the value is nested into the ring's lower gap,
overlapping the dial. The dial circle (not the wider name/value text) stays the
control's visual center.

## Behavioral conventions (Live parity)

- **Drag axis:** vertical (up = increase) for dials and most controls.
- **Fine adjust:** hold **Shift** (≈5× finer).
- **Reset:** double-click returns to `default`.
- **Keyboard:** arrows (coarse), Shift+arrows / Page (big), Home/End (min/max).
- **Events:** `input` continuously while interacting, `change` on commit — matching `<input type=range>` so host code and LOM bindings are trivial.
