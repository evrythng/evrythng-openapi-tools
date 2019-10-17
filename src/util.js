const { validate } = require('jsonschema');
const readline = require('readline');

/** Fields filtered from view **/
const FILTERED_FIELDS = [];
/** Fields that are not to be expanded **/
const EXPANDABLE = [
  'CustomFieldsDocument', 'IdentifiersDocument', 'ContributionsDocument', 'GeoJSONPointDocument',
];

/**
 * Lint an object against a schema.
 *
 * @param {object} schema - JSONSchema object.
 * @param {object} instance - Object to lint.
 * @returns {string[]} List of error stacks.
 */
const lintWithSchema = (schema, instance) => {
  const res = validate(instance, schema);
  if (res.errors.length) {
    return res.errors.map(p => p.stack);
  }

  return [];
};

/**
 * Recursively expand a schema by looking up sub-components.
 *
 * @param {object} spec - The whole spec.
 * @param {object} target - Target object to mutate with expanded sub-components.
 * @returns {object} Copy with the new data.
 */
const expand = (spec, target) => {
  const output = Object.assign({}, target);

  Object.keys(output).forEach((key) => {
    const value = output[key];

    // Don't expand basic data types
    if (typeof value !== 'object' || Array.isArray(value)) {
      return;
    }

    // If it's not a reference, expand it
    if (!value.$ref) {
      output[key] = expand(spec, value);
      return;
    }

    // Expand only fields, not full documents, to limit output verbosity
    const defName = value.$ref.substring('#/components/schemas/'.length);
    if (defName.includes('Document') && !EXPANDABLE.includes(defName)) {
      value.$ref = defName;
      return;
    }

    // Add sub-schema to target, expanding it in turn as required
    const addition = spec.components.schemas[defName];
    if (typeof addition === 'object') {
      output[key] = expand(spec, addition);
    }
  });

  // Delete fields that don't make sense in the schema view
  FILTERED_FIELDS.forEach(key => delete output[key]);
  return output;
};

/**
 * Generate a ReadMe.io format data block.
 *
 * @param {string} type - ReadMe specific block type ('code' for syntax block, 'parameters' for table)
 * @param {object} readMeData - ReadMe format JSON data.
 * @returns {string} The ReadMe.io data block.
 */
const generateReadMeWidget = (type, readMeData) =>
  `[block:${type}]\n${JSON.stringify(readMeData, null, 2)}\n[/block]`;

/**
 * Generate a ReadMe.io format table widget from rows of data.
 *
 * @param {string[]} headers - Table headers.
 * @param {[][]} rows - Array of arrays, each containing row values.
 * @returns {string} The ReadMe.io table widget string.
 */
const generateReadMeTable = (headers, rows) => {
  const table = {
    data: {},
    cols: headers.length,
    rows: rows.length,
  };

  // Add the headers
  headers.forEach((header, i) => {
    table.data[`h-${i}`] = header;
  });

  // Add the data
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      table.data[`${rowIndex}-${colIndex}`] = cell;
    });
  });

  return generateReadMeWidget('parameters', table);
};

/**
 * Build a map of operations to their path and method.
 *
 * @param {object} spec - The whole API spec.
 * @returns {object[]} List of objects containing operation, path, method.
 */
const buildOperationMap = (spec) => {
  const result = [];
  Object.keys(spec.paths).forEach((pathKey) => {
    Object.keys(spec.paths[pathKey])
      .filter(operationKey => operationKey !== 'x-api-status') // TODO: multiple exceptions
      .forEach((operationKey) => {
        const operation = spec.paths[pathKey][operationKey];
        result.push({
          method: operationKey,
          operation,
          path: pathKey,
          pathObj: spec.paths[pathKey],
        });
      });
  });
  return result;
};

/**
 * Get a value fromm the user by asking a question.
 *
 * @param {string} label - Question for response.
 * @returns {Promise<string>} User's answer to the question.
 */
const getValue = label => new Promise((resolve) => {
  const rl = readline.createInterface(process.stdin, process.stdout);
  rl.question(`${label}: `, (result) => {
    rl.close();
    resolve(result);
  });
});

/**
 * Sort summaries by their HTTP method-based descriptions.
 *
 * @param {string} a - Summary A.
 * @param {string} b - Summary B.
 * @returns {number} -1 if to be sorted A first, 1 otherwise.
 */
const sortByMethod = (a, b) => {
  const positions = {
    Create: 0,
    Read: 1,
    Update: 2,
    Delete: 3,
  };
  const [methodA] = a.split(' ');
  const [methodB] = b.split(' ');
  return positions[methodA] < positions[methodB] ? -1 : 1;
};

/**
 * Ask the user to select and order a list of options. Then return the ordered list.
 *
 * @param {string[]} items - Items to ask for sorting.
 * @param {string} prompt - Ordering purpose prompt.
 * @returns {string[]} Sorted list.
 */
const askForOrderedList = async (items, prompt) => {
  console.log(`${prompt}:`);
  items.forEach((item, i) => console.log(`  ${i}: ${item}`));
  const order = await getValue('Choose which and order as comma separated list');
  const ordering = order.split(',');
  if (!ordering.every(index => items[index])) {
    throw new Error('Invalid ordering');
  }

  let ordered = [];
  ordering.forEach(index => ordered.push(items[index]));
  return ordered;
};

/**
 * Surround a string in backticks.
 *
 * @param {string} str - String to surround in backticks.
 * @param {string} String surrounded by backtick.
 */
const backtick = str => '`' + str + '`';

/**
 * Capitalise a string.
 *
 * @param {string} str - String to capitalise.
 * @param {string} Capitalised string.
 */
const capitalise = str => str.charAt(0).toUpperCase() + str.slice(1);

module.exports = {
  expand,
  generateReadMeWidget,
  generateReadMeTable,
  lintWithSchema,
  buildOperationMap,
  getValue,
  askForOrderedList,
  backtick,
  capitalise,
};
