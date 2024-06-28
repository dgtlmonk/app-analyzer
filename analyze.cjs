

const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const pathLib = require('path');

const ENTRY_FILE = './src/App.tsx';
const OUTPUT_FILE = './analyze.json';

// Recursive function to traverse the AST of a component
function traverseComponent(filePath) {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const ast = parser.parse(sourceCode, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  const components = [];
  const functions = {};

  traverse(ast, {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      const specifiers = path.node.specifiers;

      specifiers.forEach((specifier) => {
        const name = specifier.local.name;

        if (specifier.type === 'ImportSpecifier') {
          functions[name] = { source };
        }
      });
    },

    FunctionDeclaration(path) {
      const name = path.node.id.name;
      functions[name] = { type: 'in-line' };
    },

    JSXElement(nodePath) {
      const name = nodePath.node.openingElement.name.name;
      const importDeclaration = nodePath.findParent((parent) => parent.node.type === 'ImportDeclaration');
      let childFilePath;

      if (importDeclaration) {
        const source = importDeclaration.node.source.value;
        childFilePath = pathLib.resolve(pathLib.dirname(filePath), source);
      } else {
        childFilePath = pathLib.resolve(pathLib.dirname(filePath), `${name}.tsx`);
      }

      if (fs.existsSync(childFilePath)) {
        const existingComponent = components.find((component) => component.name === name);
        if (existingComponent) {
          const { components: childComponents, functions: childFunctions } = traverseComponent(childFilePath);
          existingComponent.components = mergeComponents(existingComponent.components, childComponents);
          existingComponent.functions = { ...existingComponent.functions, ...childFunctions };
        } else {
          const params = getComponentParams(nodePath);
          components.push({ name, source: childFilePath, params, ...traverseComponent(childFilePath) });
        }
      } else {
        components.push({ name, params: {} });
      }
    },
  });

  return { components, functions };
}

// Helper function to merge components arrays
function mergeComponents(components1, components2) {
  const mergedComponents = [...components1];
  components2.forEach((component) => {
    const existingComponent = mergedComponents.find((c) => c.name === component.name);
    if (existingComponent) {
      existingComponent.components = mergeComponents(existingComponent.components, component.components);
      existingComponent.functions = { ...existingComponent.functions, ...component.functions };
    } else {
      mergedComponents.push(component);
    }
  });
  return mergedComponents;
}

// Helper function to get component parameters
function getComponentParams(nodePath) {
  const params = {};
  const attributes = nodePath.node.openingElement.attributes;
  attributes.forEach((attribute) => {
    if (attribute.type === 'JSXAttribute') {
      const name = attribute.name.name;
      let value = null;
      let type = null;
      if (attribute.value) {
        if (attribute.value.type === 'StringLiteral') {
          value = attribute.value.value;
          type = 'string';
        } else if (attribute.value.type === 'JSXExpressionContainer') {
          if (attribute.value.expression.type === 'NumericLiteral') {
            value = attribute.value.expression.value;
            type = 'number';
          } else if (attribute.value.expression.type === 'BooleanLiteral') {
            value = attribute.value.expression.value;
            type = 'boolean';
          }
        }
      }
      params[name] = { value, type };
    }
  });
  return params;
}

const result = traverseComponent(ENTRY_FILE);
console.log(result);

// Write the result to a JSON file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));

console.log(`Result written to ${OUTPUT_FILE}`);

