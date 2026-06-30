# REFORM iPad Demo

Live app: **https://thevikram123.github.io/reform-ipad-demo/**

## Install on iPad

1. Open the live app link in **Safari**.
2. Tap the **Share** button.
3. Choose **Add to Home Screen**.
4. Tap **Add**.

The REFORM icon will appear on the iPad Home Screen and open like an app. After the first successful load, the app caches its files for offline use.

Assessment records remain in that iPad browser's local storage. They are not uploaded by this app. Clearing Safari website data removes the locally stored records.

## Development

```bash
cd reform-app
npm ci
npm run dev
```

Pushes to `main` automatically deploy through the GitHub Pages workflow.
