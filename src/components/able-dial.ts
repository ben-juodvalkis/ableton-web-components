import { LitElement, html, css, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { clamp, quantize, roundTo, toNormalized } from '../internal/math.js';

/**
 * `<able-dial>` — a rotary control modeled on Ableton Live's / Max's `live.dial`.
 *
 * Interaction matches Live conventions:
 *  - vertical drag to change value (up = increase)
 *  - hold Shift while dragging for fine adjustment
 *  - double-click to reset to `default`
 *  - arrow keys / page keys for keyboard control
 *
 * The geometry is drawn as original SVG (no proprietary assets) using the arc
 * angles defined by the theme custom properties.
 *
 * @fires input  - continuously while dragging (detail: { value })
 * @fires change - once on release / commit (detail: { value })
 */
@customElement('able-dial')
export class AbleDial extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      width: var(--able-dial-size, 52px);
      font-family: var(--able-font-family);
      font-size: var(--able-font-size);
      color: var(--able-text-color);
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      cursor: ns-resize;
    }

    /* Compact form factors: smaller circle, same-size text. Each drives both
     * the host box and the .dial width via --able-dial-size; kept in sync with
     * the size constant in render(). Users can still override --able-dial-size
     * for a custom diameter. */
    :host([type='vertical']) {
      --able-dial-size: 34px;
    }
    :host([type='tiny']) {
      --able-dial-size: 24px;
      /* Tiny uses a different arc than large/vertical: a nearly-closed ring
       * with the gap in the lower-right. The track runs from 6 o'clock (min)
       * clockwise all the way around to 3 o'clock (max). In the component's
       * screen-degree convention (0=3 o'clock, 90=6 o'clock, 270=12 o'clock)
       * that's start 90deg, sweep 270deg. */
      --able-dial-arc-start: 90deg;
      --able-dial-arc-sweep: 270deg;
      /* The tiny circle is narrower than its name/value text. Let the host size
       * to the text (with the dial as the floor) and center the dial within it,
       * so the name sits centered over the dial instead of clamped to 16px. The
       * .dial keeps its own fixed --able-dial-size width below. */
      width: auto;
      min-width: var(--able-dial-size);
    }

    /* Tiny nests the value into the ring's lower gap, overlapping the dial,
     * rather than stacking it below. The .dial-wrap is the positioning context;
     * the value is pulled up over the SVG and anchored to the dial's horizontal
     * center, leaning right into the gap (live's tiny dial places the value over
     * the lower-right of the ring). Anchoring to the dial center — not the host
     * edge — keeps the dial the visual center even though the name/value may be
     * wider than the (very small) circle. */
    .dial-wrap {
      position: relative;
      /* Match the dial's own width so a tiny value's left:50% anchors to the
       * dial center, and so the wrap (and dial) stay centered within a wider
       * host. */
      width: var(--able-dial-size, 52px);
      display: block;
      /* Center the (inline) value under the dial. Without this the value would
       * sit at the wrap's left edge — visibly off-center once a unit widens it
       * (e.g. "30 %", "-6 dB"). For tiny the value is position:absolute, so this
       * has no effect there. */
      text-align: center;
    }
    :host([type='tiny']) .value {
      position: absolute;
      /* The tiny arc's gap is the lower-right wedge (3->6 o'clock). Left-anchor
       * the value just right of the dial center so it flows into that open gap;
       * left-anchoring (rather than centering) keeps the first digit in the same
       * spot regardless of digit count, clear of the bottom needle and the
       * right-hand track. The number's baseline sits level with the bottom of
       * the track ring (matching live's tiny dial). Percent of dial height so it
       * tracks the diameter. */
      left: 56%;
      bottom: 3%;
      pointer-events: none;
    }

    :host([disabled]) {
      cursor: default;
      opacity: 0.45;
    }

    .dial {
      display: block;
      width: var(--able-dial-size, 52px);
      /* Height follows the SVG aspect-ratio (set inline) so the optional
       * triangle's headroom isn't squashed; defaults to square. */
      height: auto;
      outline: none;
    }

    :host(:focus-visible) .dial {
      filter: drop-shadow(0 0 0 1px var(--able-selection-background));
    }

    .track {
      fill: none;
      stroke: var(--able-dial-track, var(--able-dial-needle));
      stroke-linecap: butt;
    }

    .arc {
      fill: none;
      /* Max's live.dial defaults its accent to the cyan RangeDefault; the
       * orange ChosenDefault is used by native device dials. Default to cyan
       * to match live.dial, override with the accent attribute. */
      stroke: var(--able-dial-accent, var(--able-range-default));
      stroke-linecap: butt;
    }

    /* The radial "clock hand" pointing from center to the value position.
     * Dark, thick, rounded — distinct from the colored value arc. */
    .needle {
      stroke: var(--able-dial-needle);
      stroke-linecap: round;
    }

    /* Optional indicator triangle above the dial (live.dial's "Show Triangle").
     * Filled with the accent color, pointing down toward the ring gap. */
    .triangle {
      fill: var(--able-dial-accent, var(--able-range-default));
      stroke: none;
    }

    /* Text elements, mirroring live.dial: name above the dial, value below.
     * Both are always rendered; visibility is toggled via the hide-* attributes
     * so the layout space collapses cleanly when hidden. */
    .name,
    .value {
      line-height: 1;
      color: var(--able-text-color);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :host([hide-name]) .name,
    .name:empty {
      display: none;
    }
    :host([hide-value]) .value {
      display: none;
    }
  `;

  /**
   * Dial form factor — Max's "Dial Type":
   *  - `large` (default): full-size dial, name above / value below.
   *  - `vertical`: a smaller circle with the same stacked name/value text.
   *  - `tiny`: the smallest circle, with the value nested into the ring's
   *    lower-right gap (overlapping the dial) instead of stacked beneath it.
   * The dial geometry itself is identical across all three; only the diameter
   * (kept in sync with the CSS `--able-dial-size` below) and, for `tiny`, the
   * value placement differ.
   */
  @property({ type: String, reflect: true }) type: 'large' | 'vertical' | 'tiny' = 'large';
  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 127;
  @property({ type: Number }) step = 0;
  @property({ type: Number }) default = 0;
  @property({ type: Number }) decimals = 2;
  /** Name shown above the dial (live.dial's "Short Name" / title). */
  @property({ type: String }) label = '';
  /** Hide the name above the dial. Inverse of live.dial's "Show Name" (shown by default). */
  @property({ type: Boolean, attribute: 'hide-name', reflect: true }) hideName = false;
  /** Hide the value below the dial. Inverse of live.dial's "Show Value" (shown by default). */
  @property({ type: Boolean, attribute: 'hide-value', reflect: true }) hideValue = false;
  /** Optional unit appended to displayed values (e.g. "dB", "%"). */
  @property({ type: String }) unit = '';
  /** Arc accent color. Any CSS color; defaults to live.dial's cyan. */
  @property({ type: String }) accent = '';
  /** Show the optional accent-colored indicator triangle above the dial (live.dial's "Show Triangle"). */
  @property({ type: Boolean }) triangle = false;
  /**
   * Bipolar mode: the colored arc fills from the 12-o'clock center outward
   * toward the value, instead of from min. Matches live.dial's "Bipolar" /
   * "Center" display used for pan, detune, etc.
   */
  @property({ type: Boolean }) bipolar = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private dragging = false;

  private pointerId: number | null = null;
  private dragStartY = 0;
  private dragStartValue = 0;

  // --- geometry (read from theme vars at render time, with fallbacks) ---
  private get arcStartDeg(): number {
    return this.cssAngle('--able-dial-arc-start', 135);
  }
  private get arcSweepDeg(): number {
    return this.cssAngle('--able-dial-arc-sweep', 270);
  }

  private cssAngle(name: string, fallback: number): number {
    const raw = getComputedStyle(this).getPropertyValue(name).trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  private get normalized(): number {
    return toNormalized(this.value, this.min, this.max);
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('tabindex') && !this.disabled) {
      this.tabIndex = 0;
    }
    this.setAttribute('role', 'slider');
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('dblclick', this.onDoubleClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('dblclick', this.onDoubleClick);
  }

  updated(): void {
    if (this.accent) {
      this.style.setProperty('--able-dial-accent', this.accent);
    } else {
      this.style.removeProperty('--able-dial-accent');
    }
    this.setAttribute('aria-valuemin', String(this.min));
    this.setAttribute('aria-valuemax', String(this.max));
    this.setAttribute('aria-valuenow', String(roundTo(this.value, this.decimals)));
    this.setAttribute('aria-disabled', String(this.disabled));
  }

  render() {
    // Dial diameter by form factor. Keep these in sync with the
    // `--able-dial-size` CSS rules so the host box matches the SVG. Sized so the
    // circle reads ~5-6x the (9.5px) text height, matching live.dial.
    const size = this.type === 'tiny' ? 24 : this.type === 'vertical' ? 34 : 52;
    const cx = size / 2;
    const cy = size / 2;
    // Radius leaves room for half the (heavy) ring stroke inside the viewBox.
    const r = size * 0.36;
    const start = this.arcStartDeg;
    const sweep = this.arcSweepDeg;
    const valueAngle = start + sweep * this.normalized;

    // Proportions pixel-measured from reference_screenshots/live-dial-large.png
    // (fractions of the ring centerline radius r):
    //   ring stroke  ~0.167 r
    //   needle width ~0.16  r  (about the same thickness as the ring)
    const stroke = Math.max(2, r * 0.167);
    const needleW = Math.max(1.5, r * 0.16);
    const end = start + sweep;
    // A background notch sits next to the needle, between the colored arc and
    // the unfilled track — the live.dial value gap. The needle is thick: at
    // radius r it covers ~atan((needleW/2)/r) on each side of the value angle,
    // so the gap must clear that or the needle hides it. needleHalfDeg is the
    // angular half-width of the needle at the ring.
    const needleHalfDeg = Math.atan2(needleW * 0.5, r) * (180 / Math.PI);
    const nearGapDeg = needleHalfDeg + 1; // colored arc stops just past needle's near edge
    const farGapDeg = needleHalfDeg + 5; // dark track resumes past needle's far edge, leaving the visible notch

    // The colored arc's fixed anchor: min in unipolar mode, the 12-o'clock
    // center of the sweep in bipolar mode.
    const anchorAngle = this.bipolar ? start + sweep / 2 : start;

    // Build the colored fill as [fillLo, fillHi] (ascending), with the notch on
    // the value side, and the dark track as whatever remains of [start, end].
    let valuePath: string;
    let trackPath: string;
    if (valueAngle >= anchorAngle) {
      // value clockwise of the anchor: fill anchor→value, notch above value
      const cyanEnd = Math.max(anchorAngle, valueAngle - nearGapDeg);
      const darkStart = Math.min(end, valueAngle + farGapDeg);
      valuePath = this.arcPath(cx, cy, r, anchorAngle, cyanEnd);
      trackPath = this.dualArcPath(cx, cy, r, start, anchorAngle, darkStart, end);
    } else {
      // value counter-clockwise of the anchor (bipolar, below center):
      // fill value→anchor, notch below value
      const cyanStart = Math.min(anchorAngle, valueAngle + nearGapDeg);
      const darkEnd = Math.max(start, valueAngle - farGapDeg);
      valuePath = this.arcPath(cx, cy, r, cyanStart, anchorAngle);
      trackPath = this.dualArcPath(cx, cy, r, start, darkEnd, anchorAngle, end);
    }

    // Needle: a short rounded "stick" near the rim — it does NOT reach the dial
    // center. Pixel-measured from reference_screenshots/live-dial-large.png
    // along the value ray: inner end at ~0.20 r from center; the needle's
    // rounded cap ends flush with the track's OUTER edge (r + stroke/2). Since
    // the round linecap extends needleW/2 past the centerline endpoint, pull the
    // centerline tip in by needleW/2 so the cap lands exactly on the outer edge.
    const outerEdge = r + stroke * 0.5;
    const hub = this.pointOnCircle(cx, cy, r * 0.2, valueAngle);
    const tip = this.pointOnCircle(cx, cy, outerEdge - needleW * 0.5, valueAngle);

    // Optional indicator triangle at top center (12 o'clock), pointing down
    // toward the ring gap. Pixel-measured from the reference: a chunky triangle
    // whose downward tip sits just above the ring's outer edge, with a base wide
    // enough to read as a marker. Sized as fractions of r.
    const triHalfW = r * 0.34; // half the base width
    const triHeight = r * 0.34; // tip-to-base vertical span
    const triGap = stroke * 0.35; // breathing room between tip and ring
    const triTipY = cy - (outerEdge + triGap);
    const triBaseY = triTipY - triHeight;
    const trianglePath = `M ${cx - triHalfW} ${triBaseY} L ${cx + triHalfW} ${triBaseY} L ${cx} ${triTipY} Z`;
    // The triangle's base extends above the ring (and possibly above y=0), so
    // when shown, grow the viewBox upward by the overflow amount. The circle
    // geometry is unchanged; only headroom is added, keeping the dial centered.
    const topOverflow = this.triangle ? Math.max(0, -triBaseY) : 0;
    const vbY = -topOverflow;
    const vbH = size + topOverflow;

    // The value normally stacks below the dial; for `tiny` it is positioned
    // (via CSS) over the SVG's lower-right gap, so it lives inside .dial-wrap
    // either way to share a positioning context.
    return html`
      <span class="name" part="name">${this.label}</span>
      <div class="dial-wrap">
        <svg
          class="dial"
          style=${`aspect-ratio: ${size} / ${vbH}`}
          viewBox="0 ${vbY} ${size} ${vbH}"
          @pointerdown=${this.onPointerDown}
          aria-hidden="true"
        >
          ${this.triangle
            ? svg`<path class="triangle" d=${trianglePath} />`
            : null}
          <path class="track" d=${trackPath} stroke-width=${stroke} />
          ${svg`<path class="arc" d=${valuePath} stroke-width=${stroke} />`}
          <line
            class="needle"
            x1=${hub.x}
            y1=${hub.y}
            x2=${tip.x}
            y2=${tip.y}
            stroke-width=${needleW}
          />
        </svg>
        <span class="value" part="value">${this.formatValue()}</span>
      </div>
    `;
  }

  private formatValue(): string {
    const v = roundTo(this.value, this.decimals);
    return this.unit ? `${v} ${this.unit}` : String(v);
  }

  // --- SVG geometry helpers (degrees, clockwise from +x axis screen-space) ---
  private pointOnCircle(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  private arcPath(
    cx: number,
    cy: number,
    r: number,
    startDeg: number,
    endDeg: number,
  ): string {
    const a = this.pointOnCircle(cx, cy, r, startDeg);
    const b = this.pointOnCircle(cx, cy, r, endDeg);
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    const sweepFlag = endDeg >= startDeg ? 1 : 0;
    return `M ${a.x} ${a.y} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${b.x} ${b.y}`;
  }

  /**
   * Two arc segments in one path string, used for the dark track when the
   * colored fill is anchored in the middle (bipolar) and so splits the track
   * into a piece on each side. Segments narrower than ~0.5° are dropped so a
   * butt-capped zero-length arc never paints a stray dot.
   */
  private dualArcPath(
    cx: number,
    cy: number,
    r: number,
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number,
  ): string {
    const seg = (s: number, e: number) =>
      e - s > 0.5 ? this.arcPath(cx, cy, r, s, e) : '';
    return [seg(aStart, aEnd), seg(bStart, bEnd)].filter(Boolean).join(' ');
  }

  // --- interaction ---
  private onPointerDown = (e: PointerEvent) => {
    if (this.disabled || e.button !== 0) return;
    e.preventDefault();
    this.focus();
    this.dragging = true;
    this.pointerId = e.pointerId;
    this.dragStartY = e.clientY;
    this.dragStartValue = this.value;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging || e.pointerId !== this.pointerId) return;
    const dy = this.dragStartY - e.clientY; // up = positive = increase
    // Full travel over ~200px; Shift = 5x finer.
    const sensitivity = (e.shiftKey ? 1 / 5 : 1) / 200;
    const range = this.max - this.min;
    const next = this.dragStartValue + dy * sensitivity * range;
    this.commit(next, 'input');
  };

  private onPointerUp = (e: PointerEvent) => {
    if (!this.dragging || e.pointerId !== this.pointerId) return;
    this.dragging = false;
    this.pointerId = null;
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.emit('change');
  };

  private onDoubleClick = () => {
    if (this.disabled) return;
    this.commit(this.default, 'input');
    this.emit('change');
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    const range = this.max - this.min;
    const coarse = this.step || range / 100;
    const big = this.step ? this.step * 10 : range / 10;
    let next = this.value;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        next += e.shiftKey ? big : coarse;
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        next -= e.shiftKey ? big : coarse;
        break;
      case 'PageUp':
        next += big;
        break;
      case 'PageDown':
        next -= big;
        break;
      case 'Home':
        next = this.min;
        break;
      case 'End':
        next = this.max;
        break;
      default:
        return;
    }
    e.preventDefault();
    this.commit(next, 'input');
    this.emit('change');
  };

  private commit(raw: number, type: 'input') {
    let v = clamp(raw, this.min, this.max);
    if (this.step) v = clamp(quantize(v, this.min, this.step), this.min, this.max);
    if (v === this.value) return;
    this.value = v;
    this.emit(type);
  }

  private emit(type: 'input' | 'change') {
    this.dispatchEvent(
      new CustomEvent(type, {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'able-dial': AbleDial;
  }
}
