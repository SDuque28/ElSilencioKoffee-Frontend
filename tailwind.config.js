/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        background: '#f8f6f2',
        surface: '#fffdf8',
        border: '#dfd8ca',
        foreground: '#2c2218',
        muted: '#6a5b4c',
        primary: '#6d3a1a',
        'primary-foreground': '#fff9f0',
        accent: '#2f6f54',
        danger: '#a43023',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px rgba(109, 58, 26, 0.08)',
      },
    },
  },
  plugins: [],
};
