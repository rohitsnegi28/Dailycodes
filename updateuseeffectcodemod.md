# Automating `useEffect` Arrow Function Syntax Update Using jscodeshift

This guide provides steps to update the `useEffect` hooks in a React project by wrapping arrow function bodies in `{}` using a custom **jscodeshift** codemod.

## Prerequisites

- Make sure you have **Node.js** and **npm** installed.
- Install **jscodeshift**, a tool for running code transformations on JavaScript/TypeScript.

### Installing jscodeshift

If you haven't already installed jscodeshift, install it globally using npm:

```bash
npm install -g jscodeshift
```

## Create the Codemod Script

1. Create a file named `wrap-useEffect-arrow-function.js` with the following content:

    ```javascript
    module.exports = function(fileInfo, api) {
      const j = api.jscodeshift;
      const root = j(fileInfo.source);

      // Find all useEffect calls
      root.find(j.CallExpression, {
        callee: {
          type: 'Identifier',
          name: 'useEffect',
        },
      })
      .forEach(path => {
        const callback = path.node.arguments[0];
        
        // Check if the callback is an arrow function without a block body
        if (
          callback && 
          callback.type === 'ArrowFunctionExpression' && 
          callback.body.type !== 'BlockStatement'
        ) {
          // Wrap the body in a block statement
          callback.body = j.blockStatement([
            j.expressionStatement(callback.body)
          ]);
        }
      });

      return root.toSource();
    };
    ```

    This script does the following:
    - It searches for all `useEffect` calls.
    - Checks if the arrow function used as the callback does not have a block body.
    - Wraps the body of the arrow function in a block statement.

## Running the Codemod

Execute the codemod against your project using the following command:

```bash
npx jscodeshift -t wrap-useEffect-arrow-function.js path/to/your/project/src --extensions=js,jsx
```

- Replace `path/to/your/project/src` with the actual path to your project's source code.
- The `--extensions` option specifies the file extensions to target (`js` and `jsx` in this case).

## Reviewing the Changes

After running the codemod, review the modified files to ensure the transformation was applied correctly.

## Formatting and Testing the Code

Once the codemod has been applied, use a linter or code formatter like **ESLint** or **Prettier** to format your code. Additionally, run your project's test suite to confirm that everything works as expected.

## Example

### Before the Codemod

```javascript
useEffect(() => doSomething(), [dependency]);
```

### After the Codemod

```javascript
useEffect(() => { doSomething(); }, [dependency]);
```

The codemod converts concise arrow function bodies into block bodies.

## Conclusion

This codemod automates the process of updating `useEffect` hooks to use block statements for arrow functions, ensuring compatibility with recent React updates.