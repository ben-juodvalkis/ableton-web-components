import type { Preview } from '@storybook/web-components';
import '../src/theme.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'live-dark',
      values: [
        { name: 'live-dark', value: '#2b2b2b' },
        { name: 'live-light', value: '#d6d6d6' },
      ],
    },
  },
};

export default preview;
