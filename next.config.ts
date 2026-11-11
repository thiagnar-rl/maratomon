import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Guias removidas: quem tiver o link antigo cai numa página que existe.
  async redirects() {
    return [
      { source: "/filmes", destination: "/temporadas", permanent: true },
      { source: "/jogos", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
