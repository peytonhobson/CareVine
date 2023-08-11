/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    screens: {
      sm: '550px',
      // => @media (min-width: 640px) { ... }
      md: '768px',
      // => @media (min-width: 768px) { ... }
      lg: '1024px',
      // => @media (min-width: 1024px) { ... }
      xl: '1921px',
      // => @media (min-width: 1280px) { ... }
      lgwp: '1128px',
      // => @media (min-width: 1536px) { ... }
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
