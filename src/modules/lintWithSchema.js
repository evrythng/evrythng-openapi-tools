const { validate } = require('jsonschema');

module.exports = (schema, instance) => {
  const res = validate(instance, schema);
  if (res.errors.length) {
    return res.errors.map(p => p.stack);
  }

  return [];
};
