const refParser = require('json-schema-ref-parser');
const yamlJs = require('yamljs');
const { generateFieldsText } = require('./fields');
const { generateSchemaText } = require('./schema');
const {
  generateReadMeWidget,
  generateReadMeTable,
  buildOperationMap,
  backtick,
  capitalise,
} = require('../../util');

/** Definitions that don't go in See Also **/
const SEE_ALSO_EXCEPTIONS = ['CustomFieldsDocument', 'IdentifiersDocument', 'TagsDocument'];

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
 * Get list of Document references that need to be in See Also below the definition.
 *
 * @param {object} spec - API spec.
 * @param {string} schemaName - Name of the schema to search.
 * @returns {string[]} List of sub schemas to be documented separatey.
 */
const getSeeAlsoList = (spec, schemaName) => {
  if (!spec.components.schemas[schemaName].properties) {
    console.log(`\nNo properties found for ${schemaName}`);
    return [];
  }

  return Object.entries(spec.components.schemas[schemaName].properties)
    .reduce((acc, [propName, propDef]) => {
      if (propDef.$ref && propDef.$ref.includes('Document')) {
        return acc.concat(propDef.$ref.split('/')[3]);
      }

      if (propDef.type === 'array' && propDef.items.$ref && propDef.items.$ref.includes('Document')) {
        return acc.concat(propDef.items.$ref.split('/')[3]);
      }

      return acc;
    }, []);
  };

const generateDefinitionText = async (spec, schemaName, exampleSummary) => {
  const derefSpec = await refParser.dereference(JSON.parse(JSON.stringify(spec)));
  if (!schemaName) {
    console.log(`Available schema objects:\n- ${Object.keys(spec.components.schemas).join('\n- ')}`);
    return;
  }

  // Title and description
  let output = `## ${schemaName} Data Model\n\n`;
  output += `${derefSpec.components.schemas[schemaName].description}\n`;

  // Three tab widget with Fields, Schema, and Example
  output += generateReadMeWidget('code', {
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
      code: exampleSummary ? generateExampleText(spec, exampleSummary) : 'TODO',
    }],
  });

  // See also list
  const seeAlsoMap = getSeeAlsoList(spec, schemaName)
    .filter(p => !SEE_ALSO_EXCEPTIONS.includes(p));
  if (seeAlsoMap.length) {
    output += '\nSee also: ';
    const linkTags = seeAlsoMap
      .map(defName => '[`' + defName + '`](#section-' + defName.toLowerCase() + '-data-model)');
    output += linkTags.join(', ');
  }

  // Filterable fields table
  const filterableFields = derefSpec.components.schemas[schemaName]['x-filterable-fields'];
  if (filterableFields) {
    const headers = ['Field', 'Type', 'Operators'];
    const rows = filterableFields.reduce((res, item) => {
      const operators = item.operators.map(backtick).join(', ');
      res.push([backtick(item.name), capitalise(item.type), operators]);
      return res;
    }, []);
    output += '\n\n### Filterable Fields\n\nThis resource type can be filtered using the following fields and operators.\n';
    output += generateReadMeTable(headers, rows);
  }

  return output + '\n___\n\n';
};

/**
 * Print fields, schema, and example in one widget.
 *
 * @param {string} specPath - The path to the OpenAPI spec file.
 * @param {string} schemaName - Name of the schema to describe.
 * @param {string} exampleSummary - Summary for operation that has an example.
 */
const execute = async (specPath, schemaName, exampleSummary) => {
  const spec = yamlJs.load(specPath);

  const output = await generateDefinitionText(spec, schemaName, exampleSummary);
  console.log(`${output}\n___\n`);
  console.log('\n\n>>> Please be aware this output still needs some editing (\'See also\', etc)\n');
};

module.exports = {
  execute,
  generateDefinitionText,
};
