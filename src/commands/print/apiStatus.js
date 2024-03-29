const yamlJs = require('yamljs');
const { buildOperationMap } = require('../../util');

/**
 * Print the API status for all paths matching the tag.
 *
 * @param {object} spec - The API spec.
 * @param {string} tag - The operation tag to use to find paths.
 */
const generateApiStatusText = (spec, tag) => {
  let output = '**API Status**\n';
  const map = buildOperationMap(spec);
  const pathData = map.filter(p => p.operation.tags[0] === tag)
    .map(p => ({ path: p.path, status: p.pathObj['x-api-status'] || 'General Availability' }));
  if (!pathData.length) {
    throw new Error('Tag not associated with any paths');
  }

  // x-api-status can add additional statuses to this map, such as Beta
  const groups = {};
  pathData.forEach(({ path, status }) => {
    groups[status] = groups[status] || [];
    if (!groups[status].includes(path)) {
      groups[status].push(path);
    }
  });

  Object.entries(groups).forEach(([groupName, groupPaths]) => {
    output += `${groupName}:\n`;
    groupPaths.forEach((path) => {
      output += '`' + path + '`\n';
    });
  });

  output += '___';
  return output;
};

/**
 * Print the standard API Status page segment.
 *
 * @param {string} tag - Tag to use to print operation paths.
 */
const execute = async (specPath, tag) => {
  const spec = yamlJs.load(specPath);
  if (!tag) {
    console.log('Please specify an operation tag, such as \'Thngs\'');
    return;
  }

  console.log();
  console.log(generateApiStatusText(spec, tag));
  console.log('\n\n>>> Please be aware this output still needs some editing (If APIs are Beta, etc)\n');
};

module.exports = {
  execute,
  generateApiStatusText,
};
