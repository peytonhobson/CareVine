/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/containers/**/*.{html,js}',
    './src/components/**/*.{html,js}',
    './public/index.html',
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    screens: {
      sm: '550px',
      md: '768px',
      lg: '1024px',
      xl: '1536px',
      lgwp: '1128px',
    },
    extend: {
      colors: {
        primary: '#6ba0b6',
        'primary-light': '#a6c6d3',
        'primary-dark': '#2f5260',
        secondary: '#77a08a',
        'secondary-light': '#74ad8a',
        'secondary-dark': '#395244',
        success: '#2ecc71',
        'success-dark': '#239954',
        'success-light': '#f0fff6',
        error: '#ff0000',
        'error-light': '#fff0f0',
        attention: '#ffaa00',
        'attention-light': '#fff7f0',
        'matter-dark': '#000000',
        matter: '#4a4a4a',
        anti: '#b2b2b2',
        negative: '#e7e7e7',
        bright: '#fcfcfc',
        light: '#ffffff',
      },
    },
  },
  plugins: [
    'postcss-import',
    ['tailwindcss/nesting', 'postcss-nesting'],
    'tailwindcss',
    'postcss-flexbugs-fixes',
    [
      'postcss-preset-env',
      {
        autoprefixer: {
          flexbox: 'no-2009',
        },
        features: { 'nesting-rules': false },
        stage: 3,
      },
    ],
  ],
};
