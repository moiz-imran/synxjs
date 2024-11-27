/** @type {import('tailwindcss').Config} */
export default {
  mode: 'jit',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  prefix: 'synx-',
  corePlugins: {
    preflight: false,
  }
};
