/**
 * jscodeshift script to convert traditional functions to arrow functions in React components
 * 
 * This transformation will:
 * - Convert regular function declarations to const arrow functions
 * - Convert function expressions in component methods to arrow functions
 * - Preserve function name, parameters, and body
 * - Focus on React component methods and standalone functions
 * 
 * Usage: jscodeshift -t transform.js src/
 */

module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let hasModifications = false;

  // Convert function declarations to const arrow functions
  // Example: function add(a, b) { return a + b; } -> const add = (a, b) => { return a + b; }
  root
    .find(j.FunctionDeclaration)
    .filter(path => {
      // Skip React component declarations (function MyComponent() { ... })
      const isReactComponent = path.node.id && 
        path.node.id.name && 
        path.node.id.name.charAt(0) === path.node.id.name.charAt(0).toUpperCase();
      return !isReactComponent;
    })
    .forEach(path => {
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
    });

  // Convert object method definitions to arrow functions in property assignments
  // Example: { method() { ... } } -> { method: () => { ... } }
  root
    .find(j.MethodDefinition)
    .filter(path => {
      // Skip React lifecycle methods and constructor
      const methodName = path.node.key.name;
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
      
      return !lifecycleMethods.includes(methodName);
    })
    .forEach(path => {
      hasModifications = true;
      
      // Create arrow function
      const arrowFunc = j.arrowFunctionExpression(
        path.node.value.params,
        path.node.value.body,
        false
      );
      
      // Create property assignment
      const property = j.property(
        'init',
        path.node.key,
        arrowFunc
      );
      
      property.computed = path.node.computed;
      
      j(path).replaceWith(property);
    });
  
  // Convert function expressions in variable declarations to arrow functions
  // Example: const foo = function() { ... } -> const foo = () => { ... }
  root
    .find(j.VariableDeclarator, {
      init: { type: 'FunctionExpression' }
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
    .find(j.AssignmentExpression, {
      right: { type: 'FunctionExpression' }
    })
    .forEach(path => {
      hasModifications = true;
      
      const { params, body } = path.node.right;
      
      // Create arrow function
      const arrowFunc = j.arrowFunctionExpression(
        params,
        body,
        false
      );
      
      path.node.right = arrowFunc;
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
      const methodName = path.node.left.property.name;
      
      // Find the method definition that corresponds to this binding
      root
        .find(j.MethodDefinition, {
          key: { name: methodName }
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
          
          j(methodPath).replaceWith(property);
          
          // Remove the binding in constructor
          j(path).remove();
        });
    });

  return hasModifications ? root.toSource() : fileInfo.source;
};
