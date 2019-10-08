const yamlJs = require('yamljs');
const { buildOperationMap, askForOrderedList } = require('../../util');
const { generateOperationText } = require('./operation');

/**
 * Find operation summaries for a given tag.
 *
 * @param {Object} spec - API spec.
 * @param {string} tag - Tag to search for.
 * @returns {string[]} List of summaries related to the tag.
 */
const findSummariesForTag = (spec, tag) => {
  const map = buildOperationMap(spec);
  const summaries = map.filter(p => p.operation.tags[0] === tag)
    .map(p => p.operation.summary)
    .sort();
  if (!summaries.length) {
    throw new Error(`No operations found for tag '${tag}'`);
  }

  return summaries;
};

/**
 * Print the selected operation snippets for a tag.
 *
 * @param {object} spec - The API spec.
 * @param {string} tag - The tag to find.
 * @returns {string} The operation snippet in full.
 */
const generateOperationsText = async (spec, tag) => {
  // Find all relevant operations
  const summaries = findSummariesForTag(spec, tag);

  // Ask user for ordering
  const prompt = '\nGenerating operations:\n  Found the following operations';
  const ordered = await askForOrderedList(summaries, prompt);
  return ordered.map(p => generateOperationText(spec, p)).join('\n');
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
  generateOperationsText,
  findSummariesForTag,
};
