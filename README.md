# TRUE HLK GmbH Website

Static multipage website for TRUE HLK GmbH.

## Local Development

```bash
npm install
npm run serve
```

Open `http://127.0.0.1:4173/index.html`.

## Build

```bash
npm run build
```

The production build is generated in `dist/`.

## GitHub Pages

This repository includes `.github/workflows/deploy.yml`, which builds the Vite site and deploys `dist/` to GitHub Pages on pushes to `main`.

In the GitHub repository settings, set **Pages > Build and deployment > Source** to **GitHub Actions**.
