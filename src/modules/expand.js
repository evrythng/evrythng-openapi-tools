const FILTERED_FIELDS = ["required"];
const EXPANDABLE = [
  'CustomFieldsDocument', 'IdentifiersDocument', 'ContributionsDocument', 'GeoJSONPointDocument',
];

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

module.exports = expand;
