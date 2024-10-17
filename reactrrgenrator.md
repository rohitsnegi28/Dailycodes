The ideal solution for this issue is to use Babel’s @babel/plugin-transform-runtime, as it ensures that the necessary polyfills for async/await are included without polluting the global scope. Here’s the recommended approach:

	1.	Install @babel/plugin-transform-runtime:

npm install @babel/plugin-transform-runtime --save-dev


	2.	Configure Babel by adding a babel.config.js file in the root of your project if you don’t already have one:

module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react'
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', { regenerator: true }]
  ]
};


	3.	Ensure Vite is configured to use Babel:
In your vite.config.js, add Babel integration:

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import babel from '@rollup/plugin-babel';

export default defineConfig({
  plugins: [
    react(),
    babel({ babelHelpers: 'runtime' })
  ]
});


	4.	Restart your development server.

This approach ensures that your project uses the Babel runtime for transpiling async/await syntax without polluting the global scope, which is a cleaner and more efficient solution.