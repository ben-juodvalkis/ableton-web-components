import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './able-dial.js';

const meta: Meta = {
  title: 'Controls/Dial',
  component: 'able-dial',
  argTypes: {
    type: { control: { type: 'select' }, options: ['large', 'vertical', 'tiny'] },
    value: { control: { type: 'number' } },
    min: { control: { type: 'number' } },
    max: { control: { type: 'number' } },
    step: { control: { type: 'number' } },
    default: { control: { type: 'number' } },
    label: { control: { type: 'text' } },
    unit: { control: { type: 'text' } },
    hideName: { control: { type: 'boolean' } },
    hideValue: { control: { type: 'boolean' } },
    triangle: { control: { type: 'boolean' } },
    bipolar: { control: { type: 'boolean' } },
    disabled: { control: { type: 'boolean' } },
  },
  args: {
    type: 'large',
    value: 64,
    min: 0,
    max: 127,
    step: 0,
    default: 64,
    label: 'Freq',
    unit: '',
    hideName: false,
    hideValue: false,
    triangle: false,
    bipolar: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: (args) => html`
    <able-dial
      type=${args.type}
      .value=${args.value}
      .min=${args.min}
      .max=${args.max}
      .step=${args.step}
      .default=${args.default}
      label=${args.label}
      unit=${args.unit}
      ?hide-name=${args.hideName}
      ?hide-value=${args.hideValue}
      ?triangle=${args.triangle}
      ?bipolar=${args.bipolar}
      ?disabled=${args.disabled}
    ></able-dial>
  `,
};

export const WithUnit: Story = {
  render: () => html`
    <able-dial
      label="Gain"
      .value=${-6}
      .min=${-70}
      .max=${6}
      .default=${0}
      unit="dB"
      decimals="1"
    ></able-dial>
  `,
};

export const HiddenText: Story = {
  render: () => html`
    <div style="display:flex; gap:18px; align-items:flex-start;">
      <able-dial label="live.dial" .value=${82} decimals="0" triangle></able-dial>
      <able-dial label="live.dial" .value=${82} decimals="0" triangle hide-value></able-dial>
      <able-dial label="live.dial" .value=${82} decimals="0" triangle hide-name></able-dial>
      <able-dial label="live.dial" .value=${82} decimals="0" triangle hide-name hide-value></able-dial>
    </div>
  `,
};

export const Bipolar: Story = {
  render: () => html`
    <div style="display:flex; gap:18px; align-items:flex-start;">
      <able-dial label="Pan" .value=${-32} .min=${-64} .max=${63} .default=${0} decimals="0" bipolar></able-dial>
      <able-dial label="Pan" .value=${0} .min=${-64} .max=${63} .default=${0} decimals="0" bipolar></able-dial>
      <able-dial label="Pan" .value=${40} .min=${-64} .max=${63} .default=${0} decimals="0" bipolar></able-dial>
      <able-dial label="Detune" .value=${18} .min=${-50} .max=${50} .default=${0} decimals="0" unit="ct" bipolar triangle></able-dial>
    </div>
  `,
};

export const LargeVsVertical: Story = {
  render: () => html`
    <style>
      .lvv-grid {
        display: grid;
        grid-template-columns: repeat(3, auto);
        gap: 28px 36px;
        justify-items: center;
        align-items: start;
      }
      .lvv-grid h3 {
        margin: 18px 0 4px;
        font: 600 13px/1 -apple-system, sans-serif;
      }
      .lvv-head {
        grid-column: 1 / -1;
        justify-self: start;
        margin: 0;
        font: 700 15px/1 -apple-system, sans-serif;
        letter-spacing: 0.04em;
      }
    </style>
    <div class="lvv-grid">
      <p class="lvv-head">LARGE DIAL</p>
      <able-dial type="large" label="live.dial" .value=${82} .default=${64} decimals="0" triangle></able-dial>
      <able-dial type="large" label="live.dial" .value=${0} .default=${64} decimals="0"></able-dial>
      <able-dial type="large" label="live.dial" .value=${20} .min=${-64} .max=${63} .default=${0} decimals="0" bipolar></able-dial>

      <p class="lvv-head">Vertical DIAL</p>
      <able-dial type="vertical" label="live.dial" .value=${54} .default=${64} decimals="0" triangle></able-dial>
      <able-dial type="vertical" label="live.dial" .value=${0} .default=${64} decimals="0"></able-dial>
      <able-dial type="vertical" label="live.dial" .value=${0} .min=${-64} .max=${63} .default=${0} decimals="0" bipolar></able-dial>

      <p class="lvv-head">Tiny DIAL</p>
      <able-dial type="tiny" label="live.dial" .value=${93} .default=${64} decimals="0" triangle></able-dial>
      <able-dial type="tiny" label="live.dial" .value=${0} .default=${64} decimals="0"></able-dial>
      <able-dial type="tiny" label="live.dial" .value=${0} .min=${-64} .max=${63} .default=${0} decimals="0" bipolar></able-dial>
    </div>
  `,
};

export const Row: Story = {
  render: () => html`
    <div style="display:flex; gap:18px; align-items:flex-start;">
      <able-dial .value=${64} label="Attack"></able-dial>
      <able-dial .value=${100} label="Decay"></able-dial>
      <able-dial .value=${30} label="Sustain"></able-dial>
      <able-dial .value=${80} label="Release"></able-dial>
      <able-dial .value=${50} label="Off" disabled></able-dial>
    </div>
  `,
};
