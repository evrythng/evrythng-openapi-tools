const refParser = require('json-schema-ref-parser');
const yamlJs = require('yamljs');
const { generateFieldsText } = require('./printFields');
const { generateSchemaText } = require('./printSchema');
const { generateReadMeDataBlock, buildOperationMap } = require('../util');

/**
 * Generate example object text using a summary.
 *
 * @param {object} spec - Full spec.
 * @param {string} exampleSummary - Summary for operation that has an example.
 * @returns {string} Example object text.
 */
const generateExampleText = (spec, exampleSummary) => {
  const found = buildOperationMap(spec).find(p => p.operation.summary === exampleSummary);
  if (!found) {
    throw new Error('Summary not found');
  }

  const [, responseFound] = Object.entries(found.operation.responses)
    .find(([code, response]) => {
      const { schema, example } = response.content['application/json'];
      return example !== undefined;
    });

  const example = responseFound.content['application/json'].example;
  if (!example) {
    throw new Error(`No example for ${exampleSummary} was found`);
  }

  return JSON.stringify(example, null, 2);
};

/**
 * Print fields, schema, and example in one widget.
 *
 * @param {string} specPath - The path to the OpenAPI spec file.
 * @param {string} schemaName - Name of the schema to describe.
 * @param {string} exampleSummary - Summary for operation that has an example.
 * @param {string[]} rest - Rest of program args.
 */
const execute = async (specPath, schemaName, exampleSummary, rest) => {
  const spec = yamlJs.load(specPath);
  const derefSpec = await refParser.dereference(JSON.parse(JSON.stringify(spec)));
  if (!schemaName) {
    console.log(`Available schema objects:\n- ${Object.keys(spec.components.schemas).join('\n- ')}`);
    return;
  }

  let output = `## ${schemaName} Data Model\n\n`;
  output += `${derefSpec.components.schemas[schemaName].description}\n`;

  output += generateReadMeDataBlock({
    codes: [{
      name: 'Fields',
      language: 'text',
      code: generateFieldsText(spec, derefSpec, schemaName),
    }, {
      name: 'Schema',
      language: 'json',
      code: generateSchemaText(derefSpec, schemaName),
    }, {
      name: 'Example',
      language: 'json',
      code: generateExampleText(spec, exampleSummary),
    }],
  });
  console.log(`\n${output}`);
};

module.exports = {
  execute,
};
