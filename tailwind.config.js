/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/js/**/*.js", "./public/javascripts/**/*.js"],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: "#1ed760",
          "green-hover": "#3be477",
          black: "#121212",
          base: "#000000",
          card: "#181818",
          "card-hover": "#282828",
          elevated: "#242424",
          "elevated-hover": "#2a2a2a",
          subdued: "#a7a7a7",
          divider: "#282828"
        }
      },
      fontFamily: {
        sans: [
          'Figtree',
          'CircularSp', 
          'CircularSp-Arab', 
          'CircularSp-Hebr', 
          'CircularSp-Cyrl', 
          'CircularSp-Grek', 
          'CircularSp-Deva', 
          'var(--fallback-fonts, sans-serif)', 
          'system-ui', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica', 
          'Arial', 
          'sans-serif'
        ]
      },
      gridTemplateColumns: {
        'auto-fil-cards': 'repeat(auto-fill, minmax(160px, 1fr))'
      }
    },
  },
  plugins: [],
}
