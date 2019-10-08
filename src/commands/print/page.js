/**
 * - Preamble
 * - API Status
 * - Jump To
 * - Definitions
 * - Operations
 */
const { writeFileSync } = require('fs');
const yamlJs = require('yamljs');
const { askForOrderedList } = require('../../util');
const { generateApiStatusText } = require('./apiStatus');
const { generateDefinitionsText, findSchemasForTag } = require('./definitions');
const { generateOperationsText, findSummariesForTag } = require('./operations');

/**
 * Generate a placeholder for the preamble section.
 * TODO: Input from spec or file?
 *
 * @returns {string} Preamble string
 */
const generatePreamble = () =>
  'TODO: Preamble explaining general purpose and concepts of the API.\n___\n\n\n';

/**
 * Generate a placeholder for the Jump To list.
 * TODO: Generate this from tag? How to limit too many items?
 *
 * @param {Object} spec - API spec.
 * @param {string} tag - Tag to use.
 * @returns {string} Jump To string.
 */
const generateJumpTo = async (spec, tag) => {
  let output = '## Jump To&darr;\n';

  // Ask user for ordering
  let prompt = '\nGenerating Jump To (1/2):\n  Found the following related definitions (some may not be relevant for this page)';
  const schemaNames = findSchemasForTag(spec, tag);
  let ordered = await askForOrderedList(schemaNames, prompt);
  ordered.forEach((name, i, items) => {
    // Aligns with 'Data Model' in generated titles from definition.js
    output += `[${name}](#section-${name.toLowerCase()}-data-model)\n`;
  });

  prompt = '\nGenerating Jump To (2/2):\n  Found the following related operations';
  const summaries = findSummariesForTag(spec, tag);
  ordered = await askForOrderedList(summaries, prompt);
  ordered.forEach((summary, i, items) => {
    // Aligns with 'Data Model' in generated titles from definition.js
    // Note - this split/join is approximate - some puctuation may break it
    output += `[${summary}](#section-${summary.toLowerCase().split(' ').join('_')})`;

    if (i !== items.length - 1) {
      output += '\n';
    }
  });

  return output + '\n___\n\n\n';
};

/**
 * Attempt to generate an entire page from an API tag to a file.
 *
 * @param {string} specPath - The path to the OpenAPI spec file.
 * @param {string} tag - Tag to use for definition and operation search.
 */
const execute = async (specPath, tag) => {
  const spec = yamlJs.load(specPath);
  if (!tag) {
    console.log('Please specify an operation tag, such as \'Thngs\'');
    return;
  }

  let output = generatePreamble();
  output += generateApiStatusText(spec, tag) + '\n\n\n';
  output += await generateJumpTo(spec, tag);
  output += await generateDefinitionsText(spec, tag);
  output += await generateOperationsText(spec, tag);

  const outputPath = `./${tag}.md`;
  writeFileSync(outputPath, output, 'utf8');
  console.log(`\nWrote ${outputPath}`);
};

module.exports = {
  execute,
};
