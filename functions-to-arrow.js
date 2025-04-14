/**
 * jscodeshift script to convert traditional functions to arrow functions in React JS projects
 * 
 * This transformation will:
 * - Convert regular function declarations to const arrow functions
 * - Convert function expressions in component methods to arrow functions
 * - Preserve function name, parameters, and body
 * - Preserve React functional components, generator functions, and lifecycle methods
 * - More cautious handling of JSX files
 * 
 * Usage: jscodeshift -t transform.js src/ --parser=tsx
 */

module.exports = function(fileInfo, api, options) {
  // Add error handling for the entire transform
  try {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    let hasModifications = false;
    
    // Only process .js, .jsx, .ts, .tsx files
    const validExtensions = ['.js', '.jsx', '.ts', '.tsx'];
    const fileExt = fileInfo.path.substring(fileInfo.path.lastIndexOf('.'));
    if (!validExtensions.includes(fileExt)) {
      return fileInfo.source;
    }
    
    // Helper function to check if node might be a React component
    function isReactComponent(node) {
      // Check for null/undefined
      if (!node) return false;
      
      // Check component naming convention (starts with capital letter)
      if (node.id && node.id.name) {
        // If name starts with uppercase, it's likely a component
        if (node.id.name.charAt(0) === node.id.name.charAt(0).toUpperCase()) {
          return true;
        }
      }
      
      // If it returns JSX, it's likely a component
      let returnsJSX = false;
      
      // Find return statements
      j(node).find(j.ReturnStatement).forEach(returnPath => {
        const returnArg = returnPath.node.argument;
        if (returnArg) {
          // Check for JSX elements or fragments
          if (returnArg.type === 'JSXElement' || 
              returnArg.type === 'JSXFragment' ||
              (returnArg.type === 'CallExpression' && 
               returnArg.callee && 
               returnArg.callee.name === 'React.createElement')) {
            returnsJSX = true;
          }
        }
      });
      
      return returnsJSX;
    }
    
    // Helper function to check if node is inside a JSX file
    const isJSXFile = fileExt === '.jsx' || fileExt === '.tsx';
    
    // Convert standard function declarations to arrow functions
    // Skip React components and generator functions
    root
      .find(j.FunctionDeclaration)
      .filter(path => {
        if (!path.node || !path.node.id) return false;
        
        // Skip generator functions
        if (path.node.generator === true) return false;
        
        // Skip React components
        if (isReactComponent(path.node)) return false;
        
        return true;
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
          console.error(`[SKIPPED] Error processing function declaration: ${e.message}`);
        }
      });
    
    // Find class methods that are safe to convert to arrow functions
    // Skip React lifecycle methods and constructors
    if (!isJSXFile || options.processJSX) {
      root
        .find(j.ClassMethod)
        .filter(path => {
          if (!path.node || !path.node.key) return false;
          
          // Get method name
          const keyNode = path.node.key;
          const methodName = keyNode.name || (keyNode.value ? String(keyNode.value) : '');
          
          // Skip lifecycle methods and constructor
          const lifecycleMethods = [
            'constructor',
            'render',
            'componentDidMount',
            'componentDidUpdate',
            'componentWillUnmount',
            'shouldComponentUpdate',
            'getDerivedStateFromProps',
            'getSnapshotBeforeUpdate',
            'componentDidCatch',
            'static getDerivedStateFromError'
          ];
          
          // Skip generators
          if (path.node.generator === true) return false;
          
          // Skip getters, setters, and computed properties
          if (path.node.kind !== 'method' || path.node.computed) return false;
          
          return !lifecycleMethods.includes(methodName);
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
            
            // Create class property
            const classProperty = j.classProperty(
              path.node.key,
              arrowFunc
            );
            
            // Set modifiers like static
            classProperty.static = path.node.static;
            
            // Replace method with property
            j(path).replaceWith(classProperty);
          } catch (e) {
            console.error(`[SKIPPED] Error processing class method: ${e.message}`);
          }
        });
    }
    
    // Convert variable declarations with function expressions to arrow functions
    root
      .find(j.VariableDeclarator)
      .filter(path => {
        if (!path.node.init) return false;
        
        // Check if it's a function expression
        const isFunctionExpr = path.node.init.type === 'FunctionExpression';
        
        // Skip generator functions
        if (isFunctionExpr && path.node.init.generator) return false;
        
        // Skip React components
        if (isFunctionExpr && isReactComponent(path.node.init)) return false;
        
        return isFunctionExpr;
      })
      .forEach(path => {
        try {
          hasModifications = true;
          
          const { params, body } = path.node.init;
          
          // Create arrow function
          const arrowFunc = j.arrowFunctionExpression(
            params,
            body,
            false
          );
          
          path.node.init = arrowFunc;
        } catch (e) {
          console.error(`[SKIPPED] Error processing variable declarator: ${e.message}`);
        }
      });
    
    // Convert assignments with function expressions to arrow functions
    root
      .find(j.AssignmentExpression)
      .filter(path => {
        if (!path.node.right) return false;
        
        // Check if right side is a function expression
        const isFunctionExpr = path.node.right.type === 'FunctionExpression';
        
        // Skip generator functions
        if (isFunctionExpr && path.node.right.generator) return false;
        
        // Skip React components
        if (isFunctionExpr && isReactComponent(path.node.right)) return false;
        
        return isFunctionExpr;
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
          console.error(`[SKIPPED] Error processing assignment expression: ${e.message}`);
        }
      });
    
    // Handle .bind(this) calls in React components
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
          }
        }
      })
      .filter(path => {
        // Check if we're binding to 'this'
        const args = path.node.right.arguments;
        return args && 
               args.length > 0 && 
               args[0].type === 'ThisExpression';
      })
      .forEach(path => {
        try {
          const methodProperty = path.node.left.property;
          
          // For computed properties, we might need different handling
          if (!methodProperty || (!methodProperty.name && !methodProperty.value)) {
            return;
          }
          
          // Get method name
          const methodName = methodProperty.name || methodProperty.value;
          
          // Find the corresponding method in the class
          let converted = false;
          
          // Check ClassMethod nodes
          root
            .find(j.ClassMethod)
            .filter(methodPath => {
              const keyNode = methodPath.node.key;
              const keyName = keyNode.name || (keyNode.value ? String(keyNode.value) : '');
              return keyName === methodName && !methodPath.node.generator;
            })
            .forEach(methodPath => {
              hasModifications = true;
              converted = true;
              
              // Create arrow function
              const arrowFunc = j.arrowFunctionExpression(
                methodPath.node.params,
                methodPath.node.body,
                false
              );
              
              // Create class property
              const classProperty = j.classProperty(
                methodPath.node.key,
                arrowFunc
              );
              
              // Set modifiers
              classProperty.static = methodPath.node.static;
              
              // Replace method with property
              j(methodPath).replaceWith(classProperty);
              
              // Remove the binding in constructor
              j(path).remove();
            });
          
          // If no matching method found, it might be defined as a property
          if (!converted) {
            // Nothing to do, let's leave it as is
          }
        } catch (e) {
          console.error(`[SKIPPED] Error processing bind expression: ${e.message}`);
        }
      });
    
    return hasModifications ? root.toSource() : fileInfo.source;
  } catch (e) {
    console.error(`[ERROR] Processing ${fileInfo.path}: ${e.message}`);
    return fileInfo.source; // Return original source on error
  }
};
