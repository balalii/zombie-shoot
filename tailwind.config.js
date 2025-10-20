/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // 1. Add the pixel font family
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
      },
      // 2. Add custom hard box-shadows for a pixelated look
      boxShadow: {
        'pixel-blue': '8px 8px 0px 0px #2563eb', // A blue shadow
        'pixel-green': '6px 6px 0px 0px #15803d', // A green shadow
      },
      // 3. Add a keyframe animation for blinking text
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      // 4. Register the animation
      animation: {
        blink: 'blink 1.5s step-start infinite',
      },
    },
  },
  plugins: [],
};
