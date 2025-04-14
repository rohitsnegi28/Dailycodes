/**
 * jscodeshift script to convert traditional functions to arrow functions in React components
 * 
 * This transformation will:
 * - Convert regular function declarations to const arrow functions
 * - Convert function expressions in component methods to arrow functions
 * - Preserve function name, parameters, and body
 * - Focus on React component methods and standalone functions
 * - Preserve generator functions (function* syntax)
 * 
 * Usage: jscodeshift -t transform.js src/
 */

module.exports = function(fileInfo, api, options) {
  // Add error handling for the entire transform
  try {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let hasModifications = false;

  // Convert function declarations to const arrow functions
  // Example: function add(a, b) { return a + b; } -> const add = (a, b) => { return a + b; }
  root
    .find(j.FunctionDeclaration)
    .filter(path => {
      // Check if valid node with needed properties
      if (!path.node || !path.node.id) return false;
      
      // Skip React component declarations (function MyComponent() { ... })
      const isReactComponent = path.node.id.name && 
        path.node.id.name.charAt(0) === path.node.id.name.charAt(0).toUpperCase();
      
      // Skip generator functions (function* gen() { ... })
      const isGenerator = path.node.generator === true;
      
      return !isReactComponent && !isGenerator;
    })
    .forEach(path => {
      try {
        hasModifications = true;
        
        // Create arrow function
        const arrowFunc = j.arrowFunctionExpression(
          path.node.params,
          path.node.body,
          false
        );
        
        // Create variable declaration
        const variableDeclarator = j.variableDeclarator(
          path.node.id,
          arrowFunc
        );
        
        const constDeclaration = j.variableDeclaration(
          'const',
          [variableDeclarator]
        );
        
        j(path).replaceWith(constDeclaration);
      } catch (e) {
        console.error(`Skipping function declaration due to error: ${e.message}`);
      }
    });

  // Convert object method definitions to arrow functions in property assignments
  // Example: { method() { ... } } -> { method: () => { ... } }
  root
    .find(j.MethodDefinition)
    .filter(path => {
      // Skip React lifecycle methods and constructor
      const methodName = path.node.key.name || (path.node.key.value || '');
      const lifecycleMethods = [
        'constructor',
        'componentDidMount',
        'componentDidUpdate',
        'componentWillUnmount',
        'shouldComponentUpdate',
        'getDerivedStateFromProps',
        'getSnapshotBeforeUpdate',
        'render'
      ];
      
      // Skip generator methods
      const isGenerator = path.node.value && path.node.value.generator === true;
      
      return !lifecycleMethods.includes(methodName) && !isGenerator;
    })
    .forEach(path => {
      try {
        hasModifications = true;
        
        // Create arrow function
        const arrowFunc = j.arrowFunctionExpression(
          path.node.value.params,
          path.node.value.body,
          false
        );
        
        // Create property assignment with proper type checking
        let keyNode = path.node.key;
        
        const property = j.property(
          'init',
          keyNode,
          arrowFunc
        );
        
        if (path.node.computed !== undefined) {
          property.computed = path.node.computed;
        }
        
        j(path).replaceWith(property);
      } catch (e) {
        // Skip this node if we encounter an error
        console.error(`Skipping node due to error: ${e.message}`);
      }
    });
  
  // Convert function expressions in variable declarations to arrow functions
  // Example: const foo = function() { ... } -> const foo = () => { ... }
  root
    .find(j.VariableDeclarator, {
      init: { type: 'FunctionExpression' }
    })
    .filter(path => {
      // Skip generator functions
      return !path.node.init.generator;
    })
    .forEach(path => {
      hasModifications = true;
      
      const { params, body } = path.node.init;
      
      // Create arrow function
      const arrowFunc = j.arrowFunctionExpression(
        params,
        body,
        false
      );
      
      path.node.init = arrowFunc;
    });

  // Convert function expressions in assignments to arrow functions
  // Example: this.handleClick = function() { ... } -> this.handleClick = () => { ... }
  root
    .find(j.AssignmentExpression)
    .filter(path => {
      return path.node.right && 
             path.node.right.type === 'FunctionExpression' && 
             !path.node.right.generator;
    })
    .forEach(path => {
      try {
        hasModifications = true;
        
        const { params, body } = path.node.right;
        
        // Create arrow function
        const arrowFunc = j.arrowFunctionExpression(
          params,
          body,
          false
        );
        
        path.node.right = arrowFunc;
      } catch (e) {
        console.error(`Skipping assignment expression due to error: ${e.message}`);
      }
    });

  // Special handling for React component methods
  // Find assignments in constructor like this.handleClick = this.handleClick.bind(this)
  // And convert the corresponding method to an arrow function
  root
    .find(j.AssignmentExpression, {
      left: {
        type: 'MemberExpression',
        object: { type: 'ThisExpression' }
      },
      right: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          property: { name: 'bind' }
        },
        arguments: [{ type: 'ThisExpression' }]
      }
    })
    .forEach(path => {
      try {
        // Handle the case where property might be a computed expression
        const methodProperty = path.node.left.property;
        
        // For computed properties, we might need different handling
        if (!methodProperty || (!methodProperty.name && !methodProperty.value)) {
          return;
        }
        
        const methodName = methodProperty.name || methodProperty.value;
        
        // Find the method definition that corresponds to this binding
        root
          .find(j.MethodDefinition)
          .filter(methodPath => {
            // Match by name, handling string literals and identifiers
            const keyNode = methodPath.node.key;
            const keyName = keyNode.name || (keyNode.value || '');
            
            // Skip generator methods
            const isGenerator = methodPath.node.value && methodPath.node.value.generator === true;
            
            return keyName === methodName && !isGenerator;
          })
          .forEach(methodPath => {
            hasModifications = true;
            
            // Create arrow function
            const arrowFunc = j.arrowFunctionExpression(
              methodPath.node.value.params,
              methodPath.node.value.body,
              false
            );
            
            // Create property assignment
            const property = j.property(
              'init',
              methodPath.node.key,
              arrowFunc
            );
            
            if (methodPath.node.computed !== undefined) {
              property.computed = methodPath.node.computed;
            }
            
            j(methodPath).replaceWith(property);
            
            // Remove the binding in constructor
            j(path).remove();
          });
      } catch (e) {
        // Skip this node if we encounter an error
        console.error(`Skipping node due to error in bind handler: ${e.message}`);
      }
    });

  return hasModifications ? root.toSource() : fileInfo.source;
  } catch (e) {
    console.error(`Error processing ${fileInfo.path}: ${e.message}`);
    return fileInfo.source; // Return original source on error
  }
};
