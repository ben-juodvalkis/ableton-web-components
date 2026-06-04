// Composes a standalone, resolution-independent hero SVG from the dials'
// actual rendered geometry (captured from the live component). Re-run by
// pasting fresh `data` from the page-extraction step if the dial changes.
import { writeFileSync } from 'node:fs';

const colors = {
  panelBg: '#3b3d48',
  frame: '#0f1117',
  text: '#b3b4bd',
  font: "-apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
};

// Per-dial geometry captured from the running component.
const dials = [
  { vb: '0 -1.7421039999999985 52 53.742104', w: 52, h: 53.7421, name: 'live.dial', value: '82', opacity: 1,
    inner: `<path d="M 19.6352 -1.7421039999999985 L 32.3648 -1.7421039999999985 L 26 4.622696000000001 Z" fill="#03c3d5"/><path fill="none" stroke="#181818" d="M 40.80664984537205 14.545676783129265 A 18.72 18.72 0 0 1 35.64151276231622 42.046171869143535" stroke-width="3.12624"/><path fill="none" stroke="#03c3d5" d="M 16.92436390898857 42.37288091764949 A 18.72 18.72 0 1 1 37.2990533667969 11.0745253672027" stroke-width="3.12624"/><line stroke="#181818" stroke-linecap="round" x1="28.53906761720117" y1="23.248514649270255" x2="38.73977176930686" y2="12.194422252713508" stroke-width="2.9952"/>` },
  { vb: '0 0 52 52', w: 52, h: 52, name: 'Gain', value: '-6 dB', opacity: 1,
    inner: `<path fill="none" stroke="#181818" d="M 43.45245161775065 32.771287361356976 A 18.72 18.72 0 0 1 35.64151276231622 42.046171869143535" stroke-width="3.12624"/><path fill="none" stroke="#03c3d5" d="M 16.92436390898857 42.37288091764949 A 18.72 18.72 0 1 1 44.61547132217464 27.975506885154644" stroke-width="3.12624"/><line stroke="#181818" stroke-linecap="round" x1="29.66711424708213" y1="26.75485700556282" x2="44.39974573473459" y2="29.78749502541145" stroke-width="2.9952"/>` },
  { vb: '0 0 52 52', w: 52, h: 52, name: 'Pan', value: '-32', opacity: 1,
    inner: `<path fill="none" stroke="#181818" d="M 16.92436390898857 42.37288091764949 A 18.72 18.72 0 0 1 7.351709591125683 24.36303181879238 M 25.673290951494053 7.282851146672357 A 18.72 18.72 0 0 1 35.64151276231622 42.046171869143535" stroke-width="3.12624"/><path fill="none" stroke="#03c3d5" d="M 8.427405851564739 19.546912762531505 A 18.72 18.72 0 0 1 25.673290951494053 7.282851146672357" stroke-width="3.12624"/><line stroke="#181818" stroke-linecap="round" x1="22.37674127872282" y1="25.056849832376166" x2="7.820299365991758" y2="21.267744033947405" stroke-width="2.9952"/>` },
  { vb: '0 -1.139068 34 35.139068', w: 34, h: 35.1391, name: 'live.dial', value: '54', opacity: 1,
    inner: `<path d="M 12.8384 -1.139068 L 21.1616 -1.139068 L 17 3.022532 Z" fill="#03c3d5"/><path fill="none" stroke="#181818" d="M 14.066447641058875 5.116739901973409 A 12.24 12.24 0 0 1 23.304066036899066 27.491727760593854" stroke-width="2.04408"/><path fill="none" stroke="#03c3d5" d="M 11.065930248184834 27.705345215386206 A 12.24 12.24 0 0 1 11.063152805675745 6.296194817204293" stroke-width="2.04408"/><line stroke="#181818" stroke-linecap="round" x1="16.026176694825594" y1="14.754032019306775" x2="12.113841566287423" y2="5.730855656871748" stroke-width="1.9584"/>` },
  // tiny: value nests in the ring gap (lower-right), so it's drawn inside the SVG box, not below.
  { vb: '0 -1.2776 24 25.2776', w: 24, h: 25.2776, name: 'live.dial', value: '93', tinyValue: true, opacity: 1,
    inner: `<path d="M 9.0624 -1.2776 L 14.9376 -1.2776 L 12 1.66 Z" fill="#03c3d5"/><path fill="none" stroke="#181818" d="M 16.01325643385742 4.3486358865819215 A 8.64 8.64 0 0 1 20.64 11.999999999999998" stroke-width="2"/><path fill="none" stroke="#03c3d5" d="M 12 20.64 A 8.64 8.64 0 1 1 13.76025895202918 3.54121235508296" stroke-width="2"/><line stroke="#181818" stroke-linecap="round" x1="12.525844196733432" y1="10.353952649295358" x2="14.705297979722344" y2="3.531619821895676" stroke-width="1.5"/>` },
  { vb: '0 0 52 52', w: 52, h: 52, name: 'Off', value: '50', opacity: 0.45,
    inner: `<path fill="none" stroke="#181818" d="M 18.59063445219808 8.808731804225555 A 18.72 18.72 0 0 1 35.64151276231622 42.046171869143535" stroke-width="3.12624"/><path fill="none" stroke="#03c3d5" d="M 16.92436390898857 42.37288091764949 A 18.72 18.72 0 0 1 14.355814010406224 11.34219209295783" stroke-width="3.12624"/><line stroke="#181818" stroke-linecap="round" x1="23.966916502756963" y1="22.856099954954352" x2="15.799003552583056" y2="10.225481523983467" stroke-width="2.9952"/>` },
];

// Layout — mirrors the centered gallery row (align-items: center).
const PAD = 18;       // panel inner padding
const GAP = 28;       // gap between cells
const NAME_H = 12;    // line box for the name above
const VALUE_H = 14;   // line box for the value below
const TEXT_GAP = 3;   // gap between dial and text
const FONT = 9.5;     // matches --able-font-size

// Each cell's full height = name + gap + dialH + gap + value (tiny: no separate value row).
function cellHeight(d) {
  const valRow = d.tinyValue ? 0 : VALUE_H + TEXT_GAP;
  return NAME_H + TEXT_GAP + d.h + valRow;
}
const cellW = (d) => d.w;
const maxCell = Math.max(...dials.map(cellHeight));
const contentW = dials.reduce((a, d) => a + cellW(d), 0) + GAP * (dials.length - 1);
const W = contentW + PAD * 2;
const H = maxCell + PAD * 2;

let x = PAD;
const cells = dials.map((d) => {
  const cx = x + d.w / 2;
  const ch = cellHeight(d);
  const top = PAD + (maxCell - ch) / 2; // vertically center the cell
  const nameY = top + NAME_H - 2;
  const dialY = top + NAME_H + TEXT_GAP;
  const valueY = dialY + d.h + TEXT_GAP + FONT - 2;
  // viewBox: x0 y0 vw vh
  const [vx, vy, vw, vh] = d.vb.split(/\s+/).map(Number);
  const g = `
    <text x="${cx.toFixed(2)}" y="${nameY.toFixed(2)}" text-anchor="middle" font-size="${FONT}" fill="${colors.text}" opacity="${d.opacity}">${d.name}</text>
    <svg x="${x.toFixed(2)}" y="${dialY.toFixed(2)}" width="${d.w}" height="${d.h.toFixed(3)}" viewBox="${d.vb}" opacity="${d.opacity}" overflow="visible">${d.inner}</svg>
    ${d.tinyValue
      ? `<text x="${(cx + d.w * 0.06).toFixed(2)}" y="${(dialY + d.h - d.h * 0.06).toFixed(2)}" text-anchor="start" font-size="${FONT}" fill="${colors.text}" opacity="${d.opacity}">${d.value}</text>`
      : `<text x="${cx.toFixed(2)}" y="${valueY.toFixed(2)}" text-anchor="middle" font-size="${FONT}" fill="${colors.text}" opacity="${d.opacity}">${d.value}</text>`}
  `;
  x += d.w + GAP;
  return g;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" font-family="${colors.font.replace(/"/g, "'")}">
  <rect x="0.5" y="0.5" width="${(W - 1).toFixed(0)}" height="${(H - 1).toFixed(0)}" rx="2" fill="${colors.panelBg}" stroke="${colors.frame}"/>
  ${cells.join('\n  ')}
</svg>
`;

writeFileSync(new URL('../docs/images/able-dial-hero.svg', import.meta.url), svg);
console.log(`wrote able-dial-hero.svg (${W.toFixed(0)}x${H.toFixed(0)})`);
