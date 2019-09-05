const refParser = require('json-schema-ref-parser');
const yamlJs = require('yamljs');
const { buildOperationMap, generateReadMeDataBlock } = require('../util');

let spec;

/**
 * Print the API status for all paths matching the tag.
 *
 * @param {string} tag - The operation tag to use to find paths.
 */
const printApiStatus = (tag) => {
  let output = '**API Status**\n';
  const map = buildOperationMap(spec);
  const pathData = map.filter(p => p.operation.tags[0] === tag)
    .map(p => ({ path: p.path, status: p.pathObj['x-api-status'] || 'Stable' }));
  if (!pathData.length) {
    throw new Error('Tag not associated with any paths');
  }

  // x-api-status can add additional statuses to this map, such as Beta
  const groups = { Stable: [] };
  pathData.forEach(({ path, status }) => {
    if (!groups[status]) {
      groups[status] = [];
    }

    if (!groups[status].includes(path)) {
      groups[status].push(path);
    }
  });

  Object.entries(groups).forEach(([groupName, groupPaths]) => {
    output += `${groupName}:\n`;

    groupPaths.forEach((path) => {
      output += '`' + path + '`\n'
    });
  });

  output += '___';
  console.log(output);
};

/**
 * Print the standard API Status page segment.
 */
const execute = async (specPath, tag, rest) => {
  spec = yamlJs.load(specPath);
  if (!tag) {
    console.log('Please specify an operation tag, such as \'Thngs\'');
    return;
  }

  console.log();
  printApiStatus(tag);
  console.log('\n\n>>> Please be aware this output still needs some editing (If APIs are Beta, etc)\n');
};

module.exports = {
  execute,
};
