/**
 * ableton-web-components
 *
 * High-fidelity, framework-agnostic web components that look and behave like
 * native Ableton Live controls. Import this entry to register all elements as
 * a side effect, or import individual components from `./components/*`.
 */
import './theme.css';

// Side-effect import guarantees the `@customElement('able-dial')` registration
// runs (and survives tree-shaking) even when consumers don't reference the class.
import './components/able-dial.js';

export { AbleDial } from './components/able-dial.js';
