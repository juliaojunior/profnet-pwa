/** @type {import('next').NextConfig} */
const nextConfig = {
//  output: 'export',
  reactStrictMode: true,
  compiler: {
    // ativa o plugin de styled-components no SWC
    styledComponents: true,
  },
}

module.exports = nextConfig
