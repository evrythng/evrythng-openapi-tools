const yamlJs = require('yamljs');

/** Map of actor names used in x-api-keys to symbols. */
const ACTORS = {
  Operator: 'O',
  'Trusted Application': 'T',
  Application: 'A',
  'Application User': 'U',
  Device: 'D',
};

/**
 * Get array of API keys using vendor extension.
 *
 * @param {Object} operation - Operation to search.
 * @returns {string[]} - Array of key symbols.
 */
const getKeysArray = (operation) => {
  const keys = operation['x-api-keys'];
  return keys ? keys.map(key => ACTORS[key]).join(', ') : '';
};

/**
 * Generate the key permissions content.
 *
 * @param {Object} spec - Loaded API spec object.
 * @returns {string} The snippet for pasting into docs.
 */
const generateKeyPermissionsText = (spec) => {
  const { paths } = spec;

  let output = '\n';
  Object.keys(paths)
    .sort()
    .forEach((pathKey) => {
      const cleanPathKey = pathKey.split('{').join(':').split('}').join('');
      output += `* \`${cleanPathKey}\`\n`;
      Object.keys(paths[pathKey])
        .filter(method => !['x-api-status'].includes(method))
        .forEach((method) => {
          const op = paths[pathKey][method];
          output += `  * \`${method.toUpperCase()}\` - ${op.summary} (${getKeysArray(op)})\n`;
        });
      output += '\n';
    });
  return output;
};

/**
 * Print content for the API Keys and Permissions page detailing which
 * keys can request which methods to each endpoint.
 *
 * @param {string} specPath - The path to the OpenAPI spec file.
 */
const execute = (specPath) => {
  const spec = yamlJs.load(specPath);

  console.log(generateKeyPermissionsText(spec));
};

module.exports = {
  execute,
  generateKeyPermissionsText,
};
