/*
 * build-themes.mjs — transcribe Ableton Live `.ask` theme color values into a
 * small JSON the playground can load.
 *
 * We read ONLY the individual colour facts (hex values) for the keys our
 * theme.css already maps to `--able-*` custom properties — no binary assets,
 * fonts, or full theme files are copied. The output is a flat list of
 * { name, vars: { "--able-…": "#rrggbb[aa]" } }.
 *
 * Usage: node scripts/build-themes.mjs [themesDir]
 * Defaults to the stock Live 12 Beta themes directory.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_THEMES_DIR =
  '/Applications/Ableton Live 12 Beta.app/Contents/App-Resources/Themes';

// 1:1 map: .ask <Key> -> --able-* custom property (mirrors src/theme.css).
const KEY_TO_VAR = {
  SurfaceArea: '--able-surface-area',
  ControlBackground: '--able-control-background',
  ControlForeground: '--able-control-foreground',
  ControlOnForeground: '--able-control-on-foreground',
  ControlContrastFrame: '--able-control-contrast-frame',
  ControlFillHandle: '--able-control-fill-handle',
  DetailViewBackground: '--able-detail-view-background',
  DisplayBackground: '--able-display-background',
  ChosenDefault: '--able-chosen-default',
  RangeDefault: '--able-range-default',
  Modulation: '--able-modulation',
  AutomationColor: '--able-automation-color',
  SelectionBackground: '--able-selection-background',
  SelectionForeground: '--able-selection-foreground',
  ControlSelectionFrame: '--able-control-selection-frame',
  TextDisabled: '--able-text-disabled',
};

// Live stores colors as #RRGGBB or #RRGGBBAA (alpha last). CSS hex also takes
// 8-digit #RRGGBBAA, so values pass straight through.
function extractColors(xml) {
  const out = {};
  const re = /<([A-Za-z0-9]+)\s+Value="(#[0-9a-fA-F]{6,8})"\s*\/>/g;
  let m;
  while ((m = re.exec(xml))) out[m[1]] = m[2];
  return out;
}

function buildTheme(file) {
  const xml = readFileSync(file, 'utf8');
  const colors = extractColors(xml);
  const vars = {};
  for (const [key, varName] of Object.entries(KEY_TO_VAR)) {
    if (colors[key]) vars[varName] = colors[key];
  }
  return { name: basename(file, '.ask'), vars };
}

const themesDir = process.argv[2] ?? DEFAULT_THEMES_DIR;

// The .ask source dir only exists where Live is installed (i.e. a dev machine).
// In CI / on a fresh clone it's absent — that's fine: the committed
// demo/public/themes.json is the source of truth there, so skip regeneration
// rather than failing the build. Pass a dir explicitly to force regeneration.
if (!existsSync(themesDir)) {
  console.log(
    `Themes source not found (${themesDir}); keeping committed demo/public/themes.json.`,
  );
  process.exit(0);
}

const files = readdirSync(themesDir)
  .filter((f) => f.endsWith('.ask'))
  .sort();

const themes = files.map((f) => buildTheme(join(themesDir, f)));
// demo/public is Vite's publicDir — files here are copied verbatim into the
// built site/, and served at the root in dev, so fetch('./themes.json') works
// both locally and on GitHub Pages.
const outPath = join(__dirname, '..', 'demo', 'public', 'themes.json');
writeFileSync(outPath, JSON.stringify(themes, null, 2) + '\n');

console.log(`Wrote ${themes.length} themes -> ${outPath}`);
