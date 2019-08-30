const refParser = require('json-schema-ref-parser');
const wrap = require('word-wrap');
const yamlJs = require('yamljs');

const MAX_WIDTH = 60;

/**
 * Given a refstring, find the definition name.
 * '#/components/schemas/ThngDocument' > 'ThngDocument'
 *
 * @param {string} ref - The full refstring.
 * @returns {string} Just the defname.
 */
const getDefName = ref => ref ? ref.split('/')[3] : '';

/**
 * Build the attribute string for a field, such as
 * (string, one of 'example' or 'not_example')
 *
 * @param {object} schema - Full object of the schema owning the property.
 * @param {string} defName - Name of the property definition being described.
 * @param {string} key - Key of the property definition being described.
 * @param {object} derefProp - Full object of the dereferenced property.
 * @returns {string} String describing the attributes of the field.
 */
const buildAttributeString = (schema, defName, key, derefProp) => {
  defName = defName || 'object';
  let result = '(';

  if (!derefProp.type) {
    throw new Error('Dereferenced property has no type!');
  }

  // It's an object
  if (derefProp.type !== 'array') {
    // Either a named schema, or just the type
    result += (derefProp.type === 'object') ? defName : derefProp.type;
  } else {
    // It's an array
    result += 'array of ';

    // ... of named objects
    const { items } = schema.properties[key];
    if (items && items.$ref) {
      result += items.$ref.split('/')[3];
    } else {
      // ... of basic named types, or basic data types
      result += (derefProp.items.type === 'object' && defName) ? defName : derefProp.items.type;
    }
  }

  // and it's read only
  if (derefProp.readOnly) {
    result += ', read-only';
  }

  // Check if it is required
  const { required } = schema;
  if (required && required.includes(key)) {
    result += ', required';
  }

  // and its enumerated
  if (derefProp.enum) {
    result += `, one of '${derefProp.enum.join('\', \'')}'`;
  }

  return `${result})`;
};

/**
 * Format a single property into a string describing it as a field.
 *
 * @param {string} key - Name of the key to describe.
 * @param {object} spec - Original API spec.
 * @param {string} schemaName - The name of the schema used to look up original properties.
 * @param {object} properties - Object of properties.
 * @returns {string} String describing the property field.
 */
const formatProperty = (key, spec, schemaName, properties) => {
  // Get the full property object, and the original $ref string
  const derefProp = properties[key];
  const schema = spec.components.schemas[schemaName];
  let defName = '';
  if (schemaName) {
    defName = getDefName(schema.properties[key].$ref);
  }

  // Write the property name and attributes, followed by the description (word-wrapped)
  let outputStr = `.${key} ${buildAttributeString(schema, defName, key, derefProp)}`;
  const wrapped = wrap(derefProp.description, { width: MAX_WIDTH, indent: ' '.repeat(4) });
  outputStr += wrapped ? `\n${wrapped}`: '';

  return `${outputStr}\n`;
};

/**
 * Format each property into a string describing its fields.
 *
 * @param {object} spec - Original API spec.
 * @param {string} schemaName - The name of the schema used to look up original properties.
 * @param {object} properties - Object of properties.
 * @returns {string} Single string describing all the properties as fields.
 */
const formatProperties = (spec, schemaName, properties) => Object.keys(properties)
  .map(key => formatProperty(key, spec, schemaName, properties))
  .join('\n');

/**
 * Transform an allOf item into a list of fields.
 *
 * @param {object} item - The allOf item.
 * @param {object} spec - Original API spec.
 * @param {object} derefSpec - The full dereferences API spec.
 * @param {string} schemaName - The name of the schema being resolved.
 * @returns {string[]} List of formatted field strings.
 */
const formatAllOfItem = (item, spec, derefSpec, schemaName) => {
  // Literal object
  if (item.properties) {
    return formatProperties(spec, null, item.properties);
  }

  // Points to schema
  if (item.$ref) {
    const defName = getDefName(item.$ref);
    const { properties } = derefSpec.components.schemas[defName];
    if (!properties) {
      throw new Error('allOf item dereferenced had no properties');
    }

    return formatProperties(spec, defName, properties);
  }
};

/**
 * Print all the properties!
 *
 * @returns {string} Printable string representing the schema's fields.
 */
const generateFieldsText = (spec, derefSpec, schemaName) => {
  const { properties, allOf } = derefSpec.components.schemas[schemaName];
  if (!properties && !allOf) {
    throw new Error('No properties to display.');
  }

  // Object has direct properties
  if (properties) {
    return formatProperties(spec, schemaName, properties);
  }

  if (allOf) {
    // Object has allOf instead of properties
    return allOf.map(item => formatAllOfItem(item, spec, derefSpec, schemaName))
      .join('\n');
  }
};

/**
 * Print a documentation description of a given OpenAPI schema's fields.
 * Each property lists its JSONSchema attributes in parentheses.
 *
 * @param {string} specPath - The path to the OpenAPI spec file.
 * @param {string} schemaName - Name of the schema to describe.
 * @param {string[]} rest - Rest of program args.
 */
const execute = async (specPath, schemaName, rest) => {
  const spec = yamlJs.load(specPath);
  const derefSpec = await refParser.dereference(JSON.parse(JSON.stringify(spec)));
  if (!schemaName) {
    console.log(`Available schema objects:\n- ${Object.keys(spec.components.schemas).join('\n- ')}`);
    return;
  }

  console.log(generateFieldsText(spec, derefSpec, schemaName).trim());
};

module.exports = {
  generateFieldsText,
  execute,
};
