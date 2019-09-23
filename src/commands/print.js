const TYPE_MAP = {
  'api-status': require('./print/apiStatus'),
  'filter-table': require('./print/filterTable'),
  definition: require('./print/definition'),
  fields: require('./print/fields'),
  operation: require('./print/operation'),
  operations: require('./print/operations'),
  schema: require('./print/schema'),
};

/**
 * Print any of the available snippet types.
 */
const execute = async (specPath, type, param3, param4) => {
  if (!TYPE_MAP[type]) {
    console.log(`Invalid type, choose from:\n  ${Object.keys(TYPE_MAP).join('\n  ')}`);
    return;
  }

  await TYPE_MAP[type].execute(specPath, param3, param4);
};

module.exports = { execute };
