/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050505",
        ink: "#f7f4ed",
        ash: "#bdb7ae",
        smoke: "#817b72",
        plum: "#8052ff",
        amber: "#ffb829",
        lichen: "#15846e",
        paper: "rgba(255,255,255,.065)"
      },
      fontFamily: {
        display: ["Avenir Next", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,.08), 0 24px 80px rgba(0,0,0,.45)"
      }
    }
  },
  plugins: []
};
