# Application Support and Maintenance (ASM) Handover Document

---

## 1. **Project Overview**

The project is a **Single Page Application (SPA)** built using **React** and is wrapped within a **.NET Web Application**. **This project cannot be started independently; it is triggered from a .NET web project that acts as a Backend for Frontend (BFF)**. This handover document provides details about the project configuration, structure, and key development aspects to ensure a smooth transition and support.

---

## 2. **Project Configuration**

### 2.1 **Node.js Setup**
   - **Version**: Ensure that the correct Node.js version (e.g., 14.x.x or 16.x.x) is installed to avoid compatibility issues.
   - **Package Manager**: Use `npm` or `yarn` to manage dependencies.
     - **Installation Command**: 
       ```bash
       npm install 
       ```
       or 
       ```bash
       yarn install 
       ```
       to install all necessary dependencies.

### 2.2 **Environment Variables**
   - The project relies on environment variables stored in a `.env` file for configuring different environments (development, production, etc.).
   - **Important Environment Variables**:
     - `API_URL`: Specifies the backend API endpoint.
     - `AUTH_TOKEN`: Stores the authentication token for secure access to the backend.

### 2.3 **Build and Development Commands**
   - **Development Mode**: The application is launched via the .NET project; ensure that the backend is running to trigger the SPA.
   - **Production Build**: To create a production-ready build, use the following command:
     ```bash
     npm run build
     ```
     This generates a `build` folder with minified and optimized assets for deployment.

---

## 3. **Project Structure**

### 3.1 **Overview of Key Folders**
   - **`src` Folder**: This folder contains the entire front-end code.
   - **`app` Folder**: The heart of the application, including all core functionalities and reusable components.

### 3.2 **Modules**
The project is divided into modules:
- **accounting**, **activity**, **admin**, **agency**, **codesAndHierarchy**, **comical**, **payments**, and **report**.

Each module has the following structure:
- **`config` Folder**:
  - **`apiConfig.js`**: Defines API endpoint details used in the module.
  - **`menuConfig.js`**: Stores configuration of the menus available in the module.
  - **`routeConfig.js`**: Handles routing details and lazy loading for components within the module.
- **`containers` Folder**: Contains landing pages for the different menus in the module.
- **`components` Folder**: Houses various components specific to the module.
- **`redux` Folder**: Manages the state for each module through actions, reducers, and side effects using Redux-Saga.

### 3.3 **Common Folder**
The **common** folder, located in `src/app/common`, contains shared resources and utility functions used across different modules of the application. It has the following sub-folders:

- **`apiManagement`**: Contains utility functions and helpers for handling API calls and managing API responses across the application.
- **`assets`**: Stores static assets like images, icons, and stylesheets.
- **`components`**: Reusable components used across different modules, such as buttons, form elements, or modal dialogs.
- **`i18n`**: Manages internationalization (i18n) and localization logic for supporting multiple languages.
- **`libs`**: Contains library functions and utility scripts used globally in the project.
- **`redux`**: Shared Redux-related logic, such as global reducers or actions that are not module-specific.
- **`util`**: Utility functions used throughout the project, such as date formatting, validation, or string manipulation.

---

## 4. **Third-Party Libraries and Dependencies**

### 4.1 **Major Dependencies**
   - **React**: Used for building the user interface.
   - **Redux**: Used for managing global application state.
   - **Redux-Saga**: Middleware for handling side effects, particularly API calls.
   - **React Router**: Handles navigation and routing within the app.
   - **Axios** (or **Fetch**): For making HTTP requests to the backend API.
   - **MUX**: A custom UI component library provided by the client, which is used extensively for building the user interface in this project. It provides a set of predefined and reusable UI elements to maintain a consistent design.

### 4.2 **Build Tools**
   - **Webpack**: Used for bundling the application’s files.
   - **Babel**: Transpiles modern JavaScript for broader browser compatibility.
   - **ESLint** and **Prettier**: Ensure consistent code style and help catch common errors.

---

## 5. **Scripts in `package.json`**

The project’s `package.json` file contains several scripts that are used for development, testing, and building the application. Below is an explanation of the key scripts:

- **`start`**:
  - Command: `npm run lint && react-scripts --openssl-legacy-provider start`
  - Description: Runs the linter before starting the development server. It uses `react-scripts` to launch the app in development mode. The `--openssl-legacy-provider` flag ensures compatibility with OpenSSL v3.x.x.

- **`all`**:
  - Command: `concurrently "npm run start" "npm run storybook"`
  - Description: Runs the application and Storybook simultaneously using `concurrently`. This is helpful for developing the main app and testing components with Storybook at the same time.

- **`build`**:
  - Command: `npm run lint && react-scripts --openssl-legacy-provider build`
  - Description: First runs the linter, then builds the app for production with `react-scripts`. The output is optimized and ready for deployment.

- **`test`**:
  - Command: `react-scripts test --coverage=true --watchAll=false --testTimeout=60000`
  - Description: Runs the test suite with coverage reporting enabled. The `watchAll=false` flag disables watching, making it suitable for one-time test runs in CI environments. The `testTimeout=60000` sets the maximum time a test can take to 60 seconds.

- **`eject`**:
  - Command: `react-scripts eject`
  - Description: Ejects the default Create React App configuration, giving full control over Webpack, Babel, and other configurations. Use this with caution as it cannot be reversed.

- **`lint`**:
  - Command: `eslint --fix .`
  - Description: Runs ESLint to check for code style and potential errors. The `--fix` flag automatically fixes simple issues.

- **`storybook`**:
  - Command: `start-storybook -p 6006 s public --no-manager-cache`
  - Description: Starts the Storybook server on port 6006. Storybook provides a UI to visualize and develop components in isolation.

- **`build-storybook`**:
  - Command: `build-storybook -o ./storybook_build`
  - Description: Builds a static version of Storybook, which can be hosted or viewed as a standalone app.

- **`lint:staged`**:
  - Command: `npm run lint`
  - Description: Runs the `lint` command, typically used with pre-commit hooks (like Husky) to lint code before it's committed.

- **`prepare`**:
  - Command: `husky install`
  - Description: Installs Husky, which is used to manage Git hooks (like pre-commit hooks) for tasks such as linting code before commits.

---

## 6. **State Management using Redux and Redux-Saga**

### 6.1 **Redux Folder Structure Overview**
Each module has its own `redux` folder, responsible for managing state within that module. This folder is structured into three main parts:

- **`actions` Folder**: Contains action creators, which dispatch actions to the Redux store.
- **`effects` Folder**: Contains **Redux-Saga** logic for handling side effects, such as API requests.
- **`reducer` Folder**: Contains reducers, which update the state in response to dispatched actions.

### 6.2 **API Call Flow with Redux and Redux-Saga**

The application leverages **Redux-Saga** to manage asynchronous operations like API calls. The typical flow is as follows:

1. **Dispatching Actions**:
   - User interactions (like button clicks) dispatch actions from the `actions` folder. These actions include a `type` (describing the action) and an optional `payload` (carrying additional data).

   Example of an action:
   ```javascript
   export const fetchPaymentsRequest = () => ({
     type: 'FETCH_PAYMENTS_REQUEST',
   });
   ```

2. **Handling Side Effects with Redux-Saga**:
   - **Saga Watchers**: Located in the `effects` folder, these functions listen for specific actions (e.g., `FETCH_PAYMENTS_REQUEST`).
   - **Saga Workers**: When a watcher detects an action, it triggers a worker that handles the side effect (such as an API call).

   The actual API endpoints are stored in the `apiConfig.js` file located in each module’s `config` folder.

---

## 7

. **GitHub Links**

- **Web Project GitHub Link**: [Web Project Repository](<insert_web_project_github_link_here>)
- **UI Project GitHub Link**: [UI Project Repository](<insert_ui_project_github_link_here>)

---

## 8. **Instructions for Copying the UI Project**

To integrate the UI project within the web project, follow these steps:

1. Navigate to the directory where the UI project is located.
2. Copy the entire UI project folder.
3. Paste the copied folder into the `ClientApp` directory of the web project.

**Example Command** (Assuming you are using a terminal):
```bash
cp -R /path/to/ui-project /path/to/web-project/ClientApp/
```

---

## 9. **Conclusion**

This document serves as a comprehensive guide to understanding and maintaining the application.
