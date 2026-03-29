import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// Default assumptions for local production builds:
// - owner: vyro1217
// - project repo: 30birthday
// This means npm run build defaults to /30birthday/ unless the environment
// indicates the repo is actually the user site vyro1217.github.io.
const DEFAULT_GITHUB_OWNER = 'vyro1217';
const DEFAULT_GITHUB_REPO = '30birthday';

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function getGithubPagesConfig(env: Record<string, string>) {
  const repository = env.GITHUB_REPOSITORY ?? `${DEFAULT_GITHUB_OWNER}/${DEFAULT_GITHUB_REPO}`;
  const owner =
    env.GITHUB_REPOSITORY_OWNER ?? repository.split('/')[0] ?? DEFAULT_GITHUB_OWNER;
  const repoName = repository.split('/')[1] ?? DEFAULT_GITHUB_REPO;
  const isUserSite = !!owner && repoName.toLowerCase() === `${owner}.github.io`.toLowerCase();

  // GitHub Pages base rules:
  // - project site  -> /30birthday/ (or /<repo-name>/)
  // - user site     -> /
  const basePath = env.VITE_BASE_PATH
    ? ensureTrailingSlash(env.VITE_BASE_PATH.startsWith('/') ? env.VITE_BASE_PATH : `/${env.VITE_BASE_PATH}`)
    : repoName && !isUserSite
      ? `/${repoName}/`
      : '/';

  const siteUrl = trimTrailingSlash(
    env.VITE_SITE_URL ||
      (owner
        ? isUserSite
          ? `https://${owner}.github.io`
          : `https://${owner}.github.io/${repoName}`
        : ''),
  );

  const ogImageUrl = env.VITE_OG_IMAGE_URL || (siteUrl ? `${siteUrl}/og-cover.png` : '');

  return {
    basePath,
    siteUrl,
    ogImageUrl,
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const { basePath, siteUrl, ogImageUrl } = getGithubPagesConfig(env);
  const resolvedBasePath = command === 'serve' ? '/' : basePath;

  return {
    base: resolvedBasePath,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-metadata-replacements',
        transformIndexHtml(html) {
          return html
            .replace(/__SITE_URL__/g, siteUrl)
            .replace(/__OG_IMAGE_URL__/g, ogImageUrl);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
