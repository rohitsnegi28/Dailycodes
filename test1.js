{
  "name": "fasat-online-development-r9-2",
  "version": "9.2.126",
  "private": true,
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
    "start": "npm run lint && react-scripts --openssl-legacy-provider start",
    "all": "concurrently \"npm run start\" \"npm run storybook\"",
    "build": "npm run lint && react-scripts --openssl-legacy-provider build",
    "test": "react-scripts test --coverage=true --watchAll=false --testTimeout=60000",
    "eject": "react-scripts eject",
    "lint": "eslint --fix .",
    "storybook": "start-storybook -p 6006 -s public --no-manager-cache",
    "build-storybook": "build-storybook -o ./storybook_build",
    "lint:staged": "npm run lint",
    "prepare": "husky install"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
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
    "@storybook/addon-a11y": "6.4.9",
    "@storybook/addon-actions": "6.4.9",
    "@storybook/addon-essentials": "6.4.9",
    "@storybook/addon-links": "6.4.9",
    "@storybook/node-logger": "6.4.9",
    "@storybook/preset-create-react-app": "3.2.0",
    "@storybook/preset-scss": "1.0.3",
    "@storybook/react": "6.4.9",
    "@testing-library/jest-dom": "5.16.1",
    "@testing-library/react": "11.2.7",
    "@testing-library/react-hooks": "7.0.2",
    "@testing-library/user-event": "12.8.3",
    "babel-loader": "8.1.0",
    "concurrently": "6.4.0",
    "css-loader": "5.2.7",
    "eslint": "7.32.0",
    "eslint-config-airbnb": "18.2.1",
    "eslint-plugin-import": "2.25.3",
    "eslint-plugin-jsx-a11y": "6.5.1",
    "eslint-plugin-react": "7.27.1",
    "eslint-plugin-react-hooks": "4.3.0",
    "husky": "8.0.3",
    "lint-staged": "14.0.1",
    "react-scripts": "4.0.3",
    "redux-mock-store": "1.5.4",
    "redux-saga-test-plan": "4.0.4",
    "sass": "1.49.0",
    "sass-loader": "10.2.1",
    "style-loader": "2.0.0",
    "webpack": "4.44.2"
  },
  "jest": {
    "collectCoverageFrom": [
      "**/*.{js,jsx}",
      "!**/node_modules/**",
      "!**/*stories.{js,jsx}",
      "!**/*backup.{js,jsx}",
      "!src/reportWebVitals.js",
      "!src/app.js",
      "!src/env/**"
    ],
    "moduleNameMapper": {
      "^lodash-es$": "lodash"
    },
    "transformIgnorePatterns": [
      "node_modules/(?!axios)"
    ]
  },
  "engines": {
    "node": "^20"
  }
}
