# UDDF → SSI QR

Convert Shearwater (or other) UDDF dive exports into MySSI QR codes. Runs in the browser — nothing is uploaded.

**Live:** [https://ssi.sofacode.dev/](https://ssi.sofacode.dev/)

## Use

1. Export a dive as UDDF from Shearwater Desktop (or Subsurface).
2. Drop the file here and scan the QR in the SSI app.

## Develop

```bash
npm install
npm run dev
```

## Build & GitHub Pages

Static export (`output: "export"`) served at the custom domain root.

```bash
npm run build   # writes ./out
```

Push to `main` to deploy via [.github/workflows/nextjs.yml](.github/workflows/nextjs.yml), or:

```bash
npm run deploy  # gh-pages -d out
```

Enable **Settings → Pages → GitHub Actions** on the repo.
