const { existsSync } = require('fs');
const OpenAPISchemaValidator = require('openapi-schema-validator').default;
const yamlJs = require('yamljs');

/**
 * Validate an input OpenAPI 3.0 YAML file.
 *
 * @param {string} inputPath - Path of the input file to validate.
 * @param {string[]} rest - Rest of program args.
 */
const execute = (inputPath, rest) => {
  if (!inputPath || !existsSync(inputPath)) {
    throw new Error('Specify a path to an OpenAPI 3.0 YAML file.');
  }

  const schema = yamlJs.load(inputPath);
  const validator = new OpenAPISchemaValidator({ version: 3 });
  const result = validator.validate(schema);

  console.log(`API specification is ${result.errors.length ? 'NOT ' : ''}valid!`);
  if (result.errors.length) {
    result.errors.forEach(item => console.log(`- ${item.schemaPath}: ${item.message}`));
    process.exitCode = 1;
  }
};

module.exports = {
  execute,
};
