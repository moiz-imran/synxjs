// tailwind.config.js

module.exports = {
  mode: 'jit', // Just-In-Time mode for optimized builds
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'], // Purge unused styles
  darkMode: 'class', // Enable dark mode via class
  theme: {
    extend: {
      colors: {
        primary: '#1D4ED8',
        secondary: '#9333EA',
        danger: '#DC2626',
        // Add more custom colors as needed
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        // Extend spacing scale
      },
      // Extend other design tokens as needed
    },
  },
  variants: {
    extend: {
      backgroundColor: ['active'],
      // Extend other variants as needed
    },
  },
  plugins: [
    // require('@tailwindcss/forms'), // Optional: Tailwind Forms plugin
    // Add other plugins as needed
  ],
};
