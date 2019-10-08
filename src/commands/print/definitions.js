const yamlJs = require('yamljs');
const { buildOperationMap, askForOrderedList } = require('../../util');
const { generateDefinitionText } = require('./definition');

/**
 * Find all schemas relating to a given tag.
 *
 * @param {Object} spec - API spec.
 * @param {string} tag - Tag to search for.
 * @returns {string[]} List of schema names related to the tag.
 */
const findSchemasForTag = (spec, tag) => {
  const map = buildOperationMap(spec);
  const names = [];
  map.filter(p => p.operation.tags[0] === tag)
    .forEach(({ operation }) => {
      const { requestBody, responses } = operation;
      if (requestBody && requestBody.content['application/json'].schema.$ref) {
        names.push(requestBody.content['application/json'].schema.$ref.split('/')[3]);
      }

      Object.entries(responses)
        .filter(([code]) => [200, 201].includes(code))
        .forEach(([, responseObj]) => {
          names.push(responseObj.content['application/json'].schema.$ref.split('/')[3]);
        });
    });

  let schemaNames = [...new Set(names)];
  if (!schemaNames.length) {
    throw new Error(`No schemas found for tag '${tag}'`);
  }

  // Search for schemas related to already identified schemas.
  // TODO: Needs to be recursive somehow...
  schemaNames.forEach((name) => {
    const { properties } = spec.components.schemas[name];
    Object.entries(properties).forEach(([, propDef]) => {
      if (propDef.$ref) {
        schemaNames.push(propDef.$ref.split('/')[3]);
      }

      if (propDef.items && propDef.items.$ref) {
        schemaNames.push(propDef.items.$ref.split('/')[3]);
      }
    });
  });

  // De-dupe final list of document schemas only
  schemaNames = [...new Set(schemaNames)];
  return schemaNames.filter(p => p.includes('Document')).sort();
};

/**
 * Print the selected definition snippets for a tag.
 *
 * @param {object} spec - The API spec.
 * @param {string} tag - The tag to find.
 * @returns {string} The operation snippet in full.
 */
const generateDefinitionsText = async (spec, tag) => {
  // Find all relevant operations
  const schemaNames = findSchemasForTag(spec, tag);

  // Ask user for ordering
  const prompt = '\nGenerating definitions:\n  Found the following related definitions (some may not be relevant for this page)';
  const ordered = await askForOrderedList(schemaNames, prompt);

  let output = '';
  for (let i = 0; i < ordered.length; i++) {
    output += await generateDefinitionText(spec, ordered[i]);
    output += '\n';
  }
  return output;
};

/**
 * Print all operations as ReadMe.io format request/response pairs.
 *
 * @param {string} tag - Summary to use for operation search.
 */
const execute = async (specPath, tag) => {
  const spec = yamlJs.load(specPath);
  if (!tag) {
    console.log('Please specify a tag, such as \'Thngs\'.');
    return;
  }

  console.log(await generateDefinitionsText(spec, tag));
  console.log('\n\n>>> Please be aware this output still needs some editing (API keys, \'See also\', Example, etc)\n');
};

module.exports = {
  execute,
  generateDefinitionsText,
  findSchemasForTag,
};
