/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        myntra: {
          primary: "#FF3F6C",
          dark: "#282C3F",
          text: "#535766",
          muted: "#696E79",
          "muted-light": "#94969F",
          border: "#E9E9EB",
          bg: "#FFFFFF",
          lightgray: "#F5F5F6",
          footerBg: "#FAFBFC",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      maxWidth: {
        container: "1280px",
      },
      height: {
        header: "80px",
        "header-mobile": "56px",
      },
      letterSpacing: {
        myntra: "0.15em",
      },
    },
  },
  plugins: [],
}
