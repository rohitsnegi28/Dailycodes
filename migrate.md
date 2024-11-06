I'll help you migrate your package.json from Create React App (CRA) to Vite. I'll create a new package.json with the necessary changes and also provide the Vite configuration file you'll need.



```json
{
  "name": "fasat-online-development-r9-2",
  "version": "9.2.126",
  "private": true,
  "type": "module",
  "dependencies": {
    "@babel/traverse": "7.23.2",
    "@manulife/mux": "3.2.57",
    "@manulife/mux-cds-icons": "1.0.6",
    "axios": "1.7.4",
    "file-saver": "2.0.5",
    "formik": "2.2.9",
    "history": "5.1.0",
    "i18next": "19.9.2",
    "i18next-http-backend": "1.4.0",
    "lodash-es": "4.17.21",
    "moment": "2.29.4",
    "nanoid": "3.1.31",
    "node-fetch": "3.2.10",
    "numeral": "2.0.6",
    "prop-types": "15.7.2",
    "pubsub-js": "1.9.4",
    "react": "17.0.2",
    "react-dom": "17.0.2",
    "react-helmet": "^6.1.0",
    "react-i18next": "11.14.3",
    "react-idle-timer": "4.6.4",
    "react-is": "17.0.2",
    "react-redux": "7.2.6",
    "react-router-dom": "5.3.0",
    "react-table": "7.7.0",
    "react-toastify": "7.0.4",
    "react-transition-group": "4.4.2",
    "redux": "4.1.2",
    "redux-devtools-extension": "2.13.9",
    "redux-saga": "1.1.3",
    "regenerator-runtime": "0.13.9",
    "structured-log": "0.2.0",
    "styled-components": "5.3.3",
    "uuid": "8.3.2",
    "web-vitals": "0.2.4",
    "yup": "0.32.11"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "serve": "vite preview",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "lint": "eslint --fix .",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build -o storybook_build",
    "lint:staged": "npm run lint",
    "prepare": "husky install"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@storybook/addon-a11y": "^7.0.0",
    "@storybook/addon-actions": "^7.0.0",
    "@storybook/addon-essentials": "^7.0.0",
    "@storybook/addon-links": "^7.0.0",
    "@storybook/react": "^7.0.0",
    "@storybook/react-vite": "^7.0.0",
    "@testing-library/jest-dom": "5.16.1",
    "@testing-library/react": "11.2.7",
    "@testing-library/react-hooks": "7.0.2",
    "@testing-library/user-event": "12.8.3",
    "@vitejs/plugin-react": "^4.2.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "7.32.0",
    "eslint-config-airbnb": "18.2.1",
    "eslint-plugin-import": "2.25.3",
    "eslint-plugin-jsx-a11y": "6.5.1",
    "eslint-plugin-react": "7.27.1",
    "eslint-plugin-react-hooks": "4.3.0",
    "husky": "8.0.3",
    "jsdom": "^22.0.0",
    "lint-staged": "14.0.1",
    "sass": "1.49.0",
    "storybook": "^7.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": "^20"
  }
}

```

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    moduleNameMapper: {
      '^lodash-es$': 'lodash'
    },
    transformIgnorePatterns: [
      'node_modules/(?!axios)'
    ]
  },
  resolve: {
    alias: {
      // Add any path aliases you have in your project here
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  }
});

```

Here are the key changes and steps to complete the migration:

1. Major Changes:
   - Replaced react-scripts with Vite
   - Upgraded Storybook to version 7
   - Replaced Jest with Vitest for testing
   - Added necessary Vite plugins and configuration

2. New Scripts:
   - `dev` instead of `start` for development
   - `build` now uses Vite
   - `serve` for previewing the production build
   - Updated test commands for Vitest

3. Additional steps needed:

Create a new `src/setupTests.js` file (if you don't already have one):

```javascript
import '@testing-library/jest-dom';
// Add any other test setup code you need
```

Update your main `index.html` - move it to the root directory with this structure:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your App Title</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.jsx"></script>
  </body>
</html>
```

4. Migration steps:
   - Install new dependencies: `npm install`
   - Remove the old `.env` files and create a new `.env` file using Vite's `VITE_` prefix
   - Update any `process.env` references to `import.meta.env`
   - Test that everything works: `npm run dev`

5. Important notes:
   - Environment variables now need to be prefixed with `VITE_` (e.g., `VITE_API_URL`)
   - CSS Modules now use `.module.css` extension by default
   - The public directory works slightly differently - assets are served from the root
   - You may need to update some import paths

Would you like me to explain any part of the migration in more detail or help with any specific aspects of the transition?
