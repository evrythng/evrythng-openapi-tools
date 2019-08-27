const { existsSync } = require('fs');
const yamlJs = require('yamljs');
const { lintWithSchema } = require('../util');

const PATH_OBJECT_SCHEMA = require('../../schemas/PathObject.schema.json');
const SCHEMA_OBJECT_SCHEMA = require('../../schemas/SchemaObject.schema.json');

const stats = {
  passed: 0,
  failed: 0,
  errors: 0,
};

/**
 * Lint some objects according to a schema.
 *
 * @param {object} objects - The objects to lint.
 * @param {object} schema - JSON schema to use.
 * @param {string} kind - Kind of objects being linted.
 */
const lintObjects = (objects, schema, kind) => {
  process.stdout.write(`\n${kind}s\n`);

  Object.entries(objects).forEach(([key, value], index) => {
    process.stdout.write(`  ${key}`);

    const errors = lintWithSchema(schema, value);
    if (!errors.length) {
      process.stdout.write(' OK!\n');
      stats.passed += 1;
      return;
    }

    stats.failed += 1;
    process.stdout.write('\n\n');
    errors.forEach((msg, i) => console.log(`    Error ${i}: ${msg}`));
    process.stdout.write('\n');
    stats.errors += errors.length;
  });
};

/**
 * Print report.
 */
const printStats = () => {
  console.log(`\nPassed: ${stats.passed}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Errors: ${stats.errors}\n`);

  if (stats.failed || stats.errors) {
    process.exitCode = 1;
  }
};

/**
 * Lint an input OpenAPI 3.0 YAML file according to pre-written schemas.
 *
 * @param {string} inputPath - Path of the input file to lint.
 * @param {string[]} rest - Rest of program args.
 */
const execute = (inputPath, rest) => {
  if (!inputPath || !existsSync(inputPath)) {
    throw new Error('Specify a path to an OpenAPI 3.0 YAML file.');
  }

  const spec = yamlJs.load(inputPath);
  lintObjects(spec.paths, PATH_OBJECT_SCHEMA, 'path');
  lintObjects(spec.components.schemas, SCHEMA_OBJECT_SCHEMA, 'schema');

  printStats();
};

module.exports = {
  execute,
};
