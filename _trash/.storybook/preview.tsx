import type { Preview } from '@storybook/nextjs-vite';
import React from 'react';

import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo',
    },

    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0a0a0a' },
        { name: 'surface', value: '#fafafa' },
        { name: 'surface-dark', value: '#141414' },
      ],
    },
  },

  decorators: [
    (Story, context) => {
      const isDark = context.globals.backgrounds?.value === '#0a0a0a' ||
        context.globals.backgrounds?.value === '#141414';

      React.useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        return () => document.documentElement.classList.remove('dark');
      }, [isDark]);

      return React.createElement(Story);
    },
  ],
};

export default preview;