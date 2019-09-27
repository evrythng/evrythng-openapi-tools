const yamlJs = require('yamljs');
const { buildOperationMap, getValue } = require('../../util');
const { generateDefinitionText } = require('./definition');

/**
 * Print the selected definition snippets for a tag.
 *
 * @param {object} spec - The API spec.
 * @param {string} tag - The tag to find.
 * @returns {string} The operation snippet in full.
 */
const generateDefinitionsText = async (spec, tag) => {
  // Find all relevant operations
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
  const schemaNames = [...new Set(names)];
  if (!schemaNames.length) {
    throw new Error(`No schemas found for tag '${tag}'`);
  }

  // Ask user for ordering
  schemaNames.forEach((item, i) => console.log(`${i}: ${item}`));
  const order = await getValue('Choose which and order as comma separated list');
  const ordering = order.split(',');
  if (!ordering.every(index => schemaNames[index])) {
    throw new Error('Invalid ordering');
  }

  const list = [];
  let output = '';
  ordering.forEach(index => list.push(schemaNames[index]));
  for (let i = 0; i < ordering.length; i++) {
    output += await await generateDefinitionText(spec, list[i]);
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
};
