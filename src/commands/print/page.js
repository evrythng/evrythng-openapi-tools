/**
 * - Preamble
 * - API Status
 * - Jump To
 * - Definitions
 * - Operations
 */
const { writeFileSync } = require('fs');
const yamlJs = require('yamljs');
const { generateApiStatusText } = require('./apiStatus');
const { generateDefinitionsText } = require('./definitions');
const { generateOperationsText } = require('./operations');

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
 * @returns {string} Jump To string.
 */
const generateJumpTo = () =>
  '## Jump To&darr;\nTODO: Write or generate list of contents links.\n___\n\n\n';

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
  output += generateJumpTo();
  output += await generateDefinitionsText(spec, tag);
  output += await generateOperationsText(spec, tag);

  const outputPath = `./${tag}.md`;
  writeFileSync(outputPath, output, 'utf8');
  console.log(`\nWrote ${outputPath}`);
};

module.exports = {
  execute,
};
