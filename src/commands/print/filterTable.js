const refParser = require('json-schema-ref-parser');
const yamlJs = require('yamljs');

/**
 * Generate the equivalent of a ReadMe.io table widget.
 *
 * @param {object} derefSpec - Dereferenced API spec.
 */
const generateFilterTableText = (derefSpec) => {
  const readMeTableData = {
    // Key-value row-col (h is row for header), e.g: "6-1" for row 6 col 2
    data: {
      'h-0': 'Resource',
      'h-1': 'Available Fields',
    },
    // Fixed number of columns (Resource, Available Fields)
    cols: 2,
    // Rows, matching number of listed resource types
    rows: 0,
  };

  let output = '[block:parameters]\n';
  Object.entries(derefSpec.components.schemas).forEach(([defName, schema]) => {
    if (!schema['x-filterable-fields']) {
      return;
    }

    readMeTableData.data[`${readMeTableData.rows}-0`] = defName.split('Document')[0];
    readMeTableData.data[`${readMeTableData.rows}-1`] = schema['x-filterable-fields']
      .map(p => '`' + p + '`')
      .join(', ');
    readMeTableData.rows++;
  });

  output += JSON.stringify(readMeTableData, null, 2);
  output += '\n[/block]';
  return output;
};

/**
 * Print the 'Available Fields' table for the Filters page using all schemas'
 * x-filterable-fields implementation.
 *
 * @param {string} specPath - The path to the OpenAPI spec file.
 */
const execute = async (specPath) => {
  const spec = yamlJs.load(specPath);
  const derefSpec = await refParser.dereference(JSON.parse(JSON.stringify(spec)));

  const output = generateFilterTableText(derefSpec);
  console.log(output);
};

module.exports = {
  execute,
  generateFilterTableText,
};
