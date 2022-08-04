export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const argTypes = { globalarg: { options: ['A', 'B'], control: 'select' } };

export const args = { globalarg: 'A' };
