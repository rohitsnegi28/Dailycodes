The error you're seeing now is:

"Uncaught ReferenceError: regeneratorRuntime is not defined"

This error typically occurs when you're using async/await or generator functions in your code, but the necessary runtime support isn't available. This is often due to a misconfiguration in your build process or missing polyfills. Here's how you can address this:

1. Install necessary dependencies:
   Run the following command in your project directory:
   ```
   npm install --save-dev @babel/plugin-transform-runtime
   ```
   And also:
   ```
   npm install --save @babel/runtime
   ```

2. Update your Babel configuration:
   If you have a `.babelrc` file or a `babel` section in your `package.json`, add the following:

   ```json
   {
     "plugins": [
       ["@babel/plugin-transform-runtime",
         {
           "regenerator": true
         }
       ]
     ]
   }
   ```

   If you're using a `babel.config.js` file:

   ```javascript
   module.exports = {
     plugins: [
       ['@babel/plugin-transform-runtime', {
         regenerator: true
       }]
     ]
   };
   ```

3. If you're using Create React App or a similar setup that doesn't allow direct Babel configuration, you might need to use `react-app-rewired` to override the default configuration. Here's how:

   a. Install necessary packages:
      ```
      npm install --save-dev react-app-rewired customize-cra
      ```

   b. Create a `config-overrides.js` file in your project root:
      ```javascript
      const { override, addBabelPlugin } = require('customize-cra');

      module.exports = override(
        addBabelPlugin(['@babel/plugin-transform-runtime', { regenerator: true }])
      );
      ```

   c. Update your `package.json` scripts:
      ```json
      "scripts": {
        "start": "react-app-rewired start",
        "build": "react-app-rewired build",
        "test": "react-app-rewired test"
      }
      ```

4. After making these changes, stop your development server and run:
   ```
   npm install
   ```
   Then start your server again:
   ```
   npm start
   ```

If you're using a different build setup (like Vite, which I see mentioned in your error stack), the process might be slightly different. For Vite, you would need to add the plugin to your `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-transform-runtime', { regenerator: true }],
        ],
      },
    }),
  ],
})
```

These steps should provide the necessary runtime support for async/await and generator functions, resolving the "regeneratorRuntime is not defined" error. If you continue to face issues, please provide more details about your build setup and configuration files.​​​​​​​​​​​​​​​​