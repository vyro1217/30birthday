# 30th Birthday Card

A frontend-only birthday card built as a small mobile-first web experience.

## Run locally

Prerequisite: Node.js

1. Install dependencies with `npm install`
2. Start the dev server with `npm run dev`
3. Build for production with `npm run build`

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. In GitHub, enable Pages and set the source to `GitHub Actions`.
3. Push to `main` or run the `Deploy to GitHub Pages` workflow manually.

The workflow automatically sets the correct Vite base path for:

- `username.github.io`
- `username.github.io/repository-name`

## Notes

- No backend, database, login, or API is required
- The experience is designed to be shared as a link and opened on a phone
- Photos and other static assets should stay under `public/` so they deploy cleanly to Pages