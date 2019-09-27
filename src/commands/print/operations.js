const yamlJs = require('yamljs');
const { buildOperationMap, getValue } = require('../../util');
const { generateOperationText } = require('./operation');

/**
 * Print the selected operation snippets for a tag.
 *
 * @param {object} spec - The API spec.
 * @param {string} tag - The tag to find.
 * @returns {string} The operation snippet in full.
 */
const generateOperationsText = async (spec, tag) => {
  // Find all relevant operations
  const map = buildOperationMap(spec);
  const summaries = map.filter(p => p.operation.tags[0] === tag)
    .map(p => p.operation.summary);
  if (!summaries.length) {
    throw new Error(`No operations found for tag '${tag}'`);
  }

  // Ask user for ordering
  summaries.forEach((item, i) => console.log(`${i}: ${item}`));
  const order = await getValue('Enter desired ordering as comma separated list');
  const ordering = order.split(',');
  if (!ordering.every(index => summaries[index])) {
    throw new Error('Invalid ordering');
  }

  const list = [];
  ordering.forEach(index => list.push(summaries[index]));
  return list.map(p => generateOperationText(spec, p)).join('\n');
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

  console.log(await generateOperationsText(spec, tag));
  console.log('\n\n>>> Please be aware this output still needs some editing (API keys, \'See also\', Example, etc)\n');
};

module.exports = {
  execute,
};
