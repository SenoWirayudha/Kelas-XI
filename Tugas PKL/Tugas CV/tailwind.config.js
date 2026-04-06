/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 20px 45px -25px rgba(31, 38, 135, 0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        float1: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-40px) scale(1.05)' },
          '66%': { transform: 'translate(-20px,20px) scale(0.97)' },
        },
        float2: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '40%': { transform: 'translate(-35px,25px) scale(1.08)' },
          '70%': { transform: 'translate(15px,-30px) scale(0.95)' },
        },
        float3: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(20px,-20px) scale(1.04)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        float1: 'float1 8s ease-in-out infinite',
        float2: 'float2 10s ease-in-out infinite',
        float3: 'float3 12s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}