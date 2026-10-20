import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // Mantener páginas dinámicas en caché del cliente durante 30s
      static: 180, // Mantener páginas estáticas en caché del cliente durante 3 minutos
    },
  },
};

export default nextConfig;
