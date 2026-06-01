module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#D85A30",
        'dark': "#1a1a1a",
        'gold': "#ffd700",
        'success': "#22c55e",
      },
      fontSize: {
        '2xs': '7px',
        'xs': '8px',
        'sm': '9px',
        'base': '10px',
      }
    },
  },
  plugins: [],
};
