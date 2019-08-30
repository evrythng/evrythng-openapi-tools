const { validate } = require('jsonschema');

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
 * @param {object} readMeData - ReadMe format JSON data.
 * @returns {string} The ReadMe.io data block.
 */
const generateReadMeDataBlock = readMeData =>
  `[block:code]\n${JSON.stringify(readMeData, null, 2)}\n[/block]`;

/**
 * Build a map of operations to their path and method.
 *
 * @param {object} spec - The whole API spec.
 * @returns {object[]} List of objects containing operation, path, method.
 */
const buildOperationMap = (spec) => {
  const result = [];
  Object.keys(spec.paths).forEach((pathKey) => {
    Object.keys(spec.paths[pathKey]).forEach((operationKey) => {
      const operation = spec.paths[pathKey][operationKey];
      result.push({
        method: operationKey,
        operation,
        path: pathKey,
      });
    });
  });
  return result;
};

module.exports = {
  expand,
  generateReadMeDataBlock,
  lintWithSchema,
  buildOperationMap,
};
