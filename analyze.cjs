
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
        } else if (specifier.type === 'ImportDefaultSpecifier') {
          components.push({ name, source });
        }
      });
    },

    FunctionDeclaration(path) {
      const name = path.node.id.name;
      functions[name] = { type: 'in-line' };
    },

    JSXElement(nodePath) {
      const name = nodePath.node.openingElement.name.name;
      const importDeclaration = nodePath.findParent((parent) => {
        return parent.node.type === 'ImportDeclaration';
      });
      let childFilePath;

      if (importDeclaration) {
        const source = importDeclaration.node.source.value;
        childFilePath = pathLib.resolve(pathLib.dirname(filePath), source);
      } else {
        childFilePath = pathLib.resolve(pathLib.dirname(filePath), `${name}.tsx`);
      }

      if (fs.existsSync(childFilePath)) {
        components.push({ name, source: childFilePath, ...traverseComponent(childFilePath) });
      } else {
        components.push({ name });
      }
    },
  });

  return { components, functions };
}

const result = traverseComponent(ENTRY_FILE);
console.log(result)

// Write the result to a JSON file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));

console.log(`Result written to ${OUTPUT_FILE}`);

