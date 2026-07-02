import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim();
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const withTrailingSlash = withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
  return withTrailingSlash === '//' ? '/' : withTrailingSlash;
}

/** Vite config with a configurable base path (e.g. /chat/ in production). */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const basePath = normalizeBasePath(env.VITE_BASE_PATH || '/');

  const apiProxyPath = basePath === '/' ? '/api' : `${basePath}api`;

  return {
    base: basePath,
    plugins: [
      react(),
      {
        name: 'school-chat-subpath-dev-fallback',
        configureServer(server) {
          if (basePath === '/') return;

          // Vite expects the public base URL to end with a slash (e.g. /chat/).
          // Some proxies or humans may hit /chat without the trailing slash.
          const withoutTrailingSlash = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

          server.middlewares.use((req, res, next) => {
            if (req.url === withoutTrailingSlash) {
              res.statusCode = 302;
              res.setHeader('Location', basePath);
              res.end();
              return;
            }
            next();
          });
        },
      },
    ],
    build: {
      target: ['es2020', 'safari14', 'chrome87', 'firefox78'],
    },
    server: {
      port: 5173,
      proxy: {
        [apiProxyPath]: {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
