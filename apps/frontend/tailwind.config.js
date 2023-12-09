const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'), ...createGlobPatternsForDependencies(__dirname)],
  theme: {
    extend: {},
    colors: {
      primary: {
        light: '#fecaca' /* red.200 */,
        default: '#f87171' /* red.400 */,
        dark: '#b91c1c' /* red.700 */,
      },
      secondary: {
        light: '#C6F6D5' /* green.200 */,
        default: '#68D391' /* green.400 */,
        dark: '#2F855A' /* green.700 */,
      },
      neutral: {
        light: '#EDF2F7' /* gray.200 */,
        default: '#CBD5E0' /* gray.400 */,
        dark: '#4A5568' /* gray.700 */,
      }
    }
  },
  plugins: [],
};
