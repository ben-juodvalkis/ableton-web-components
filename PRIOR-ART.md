# Prior art & differentiation

Before starting this project we surveyed existing web knob/slider libraries and Ableton-related tooling. None occupy the same niche. This document credits that work and states clearly how `ableton-web-components` differs — both as good open-source hygiene and to answer the inevitable "isn't this just X?".

## Generic web-audio control libraries

| Project | What it is | Why it's different from this |
| --- | --- | --- |
| [g200kg/webaudio-controls](https://github.com/g200kg/webaudio-controls) | The most mature Web Components knob/slider/keyboard kit. Mimics `<input type=range>` events. | **Sprite-image (filmstrip PNG) based** and generically styled. Great API reference (we deliberately matched its `input`/`change` event model), but not Ableton-themed and not vector. |
| [ColinBD/JSAudioKnobs](https://github.com/ColinBD/JSAudioKnobs) | Preset hardware-style knob skins (SSL-ish, vintage, etc.). | Emulates *hardware / other DAWs*, image-sprite based, not Web Components. |
| [andrelaszlo/pure-knob](https://www.cssscript.com/canvas-javascript-knob-dial-component/) | Canvas knob/dial/gauge. | Generic, canvas-based, single control, not Live-styled. |
| [jherrm/knobs](https://github.com/jherrm/knobs) | Logic-only knob (returns angles; you render). | GarageBand-targeted, no Live look, not a component. |
| [yairEO/knobs](https://github.com/yairEO/knobs) | CSS knob controller with iframe isolation. | Generic styling, not Live, not Web Components. |

## Ableton-specific tooling

| Project | What it is | Why it's different |
| --- | --- | --- |
| [Knobbler4](https://github.com/zsteinkamp/m4l-Knobbler4) | Excellent Max for Live device + TouchOSC control surface for mapping params to an iPad. | Solves *remote control of Live*, not *building Live-styled UI in a webview*. |
| Max `live.dial` / `live.slider` | Native Max objects that look exactly like Live devices. | Proprietary, only available inside Max/Max for Live — **not usable in the Extensions SDK webview.** This project is the web analogue. |

## The gap we fill

1. **Ableton-fidelity, not generic.** Geometry and colors recreated to match native Live controls, drawn as original SVG/CSS (no sprites, no proprietary assets).
2. **`.ask` theme mapping.** CSS custom properties mirror Live's own skin variable names, so controls can auto-match the user's active theme — nothing else does this.
3. **Extensions-SDK-first.** Packaging, examples, and docs aimed at the [Extensions SDK](https://ableton.github.io/extensions-sdk/) webview (launched 2 June 2026), where authors currently have **no** UI component option.

If you maintain one of the projects above and want a correction or different framing, please open an issue.
