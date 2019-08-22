const refParser = require('json-schema-ref-parser');
const yamlJs = require('yamljs');
const expand = require('../modules/expand');

/**
 * Fold up the schema's single line objects and multi-line arrays.
 * The output is a string representation of the object.
 *
 * For example:
 * {
 *   "foo": "bar"
 * }
 *
 * becomes:
 *
 * { "foo": "bar" }
 *
 * @param {object} input - Input object to transform.
 * @returns {string} String representation of the object that can be use in docs.
 */
const fold = (input) => {
  const lines = input.split('\n');

  // For each line in stringified format
  return lines.reduce((res, line, i) => {
    let lineStr = line;

    // Last line is always simple
    if (i >= lines.length - 2) {
      return res.concat(lineStr);
    }

    // Single item objects become one line
    const ahead = lines[i + 2].trim();
    if (line.includes(' {') && (ahead === '}' || ahead === '},')) {
      lineStr += ` ${lines[i + 1].trim()} ${ahead}`;
      lines.splice(i + 1, 2);
    }

    // Multi-line arrays (but not arrays of objects)
    if (line.includes(' [') && !lines[i + 1].includes(' {')) {
      const endLine = lines.slice(i).find(item => item.endsWith(']') || item.endsWith('],'));
      const items = lines.slice(i + 1, lines.indexOf(endLine)).map(item => item.trim());
      lineStr += `${items.join(' ')}${endLine.endsWith(']') ? ']' : '],'}`;
      lines.splice(i + 1, items.length + 1);
    }

    return res.concat(lineStr);
  }, []).join('\n');
};

/**
 * Generate the schema text itself.
 *
 * @param {object} derefSpec - The dereferenced specification object.
 * @param {string} schemaName - The name of the schema to print.
 * @returns {string} String representation of the schema.
 */
const generateSchemaText = (derefSpec, schemaName) => {
  const defObj = expand(derefSpec, derefSpec.components.schemas[schemaName]);

  // Handle allOf by blending all items' properties into one top-level one
  if (defObj.allOf) {
    defObj.properties = defObj.allOf.reduce((res, item) => Object.assign(res, item.properties), {});
    delete defObj.allOf;
  }

  return fold(JSON.stringify(defObj, null, 2));;
};

/**
 * Print a documentation description of a given OpenAPI schema.
 *
 * @param {string} specPath - The path to the OpenAPI spec file.
 * @param {string} schemaName - Name of the schema to describe.
 * @param {string[]} rest - Rest of program args.
 */
const execute = async (specPath, schemaName, rest) => {
  const spec = yamlJs.load(specPath);
  const derefSpec = await refParser.dereference(JSON.parse(JSON.stringify(spec)));
  if (!schemaName) {
    console.log(`Available schema objects:\n- ${Object.keys(spec.components.schemas).join('\n- ')}`);
    return;
  }

  const output = generateSchemaText(derefSpec, schemaName);
  console.log(output);
};

module.exports = {
  generateSchemaText,
  execute,
};
