const { expect } = require('chai');
const refParser = require('json-schema-ref-parser');
const printFields = require('../src/commands/printFields');
const printSchema = require('../src/commands/printSchema');

const SPEC = {
  components: {
    schemas: {
      ExampleDocument: {
        description: 'An example document object.',
        required: ['name', 'createdAt', 'customFields'],
        properties: {
          name: {
            type: 'string',
            description: 'Friendly name of this resource.',
          },
          createdAt: {
            type: 'integer',
            description: 'Timestamp when the resource was created.',
            readOnly: true,
          },
          tags: {
            type: 'array',
            description: 'Array of string tags associated with this resource.',
            items: {
              type: 'string',
            },
          },
          customFields: {
            type: 'object',
            description: 'Object of case-sensititve key-value pairs of custom fields associated with the resource.',
          },
          fruits: {
            type: 'string',
            description: 'One of a list of acceptable fruits.',
            enum: ['apples', 'lemons'],
          },
          location: {
            $ref: '#/components/schemas/LocationDocument',
          }
        },
      },
      LocationDocument: {
        type: 'object',
        description: 'Object representing a location.',
      },
    },
  },
};

describe('evrythng-openapi-tools', () => {
  describe('printFields', () => {
    it('should print expected fields for a given schema name', async () => {
      const expected = `.name (string)
    Friendly name of this resource.

.createdAt (integer, read-only)
    Timestamp when the resource was created.

.tags (array of string)
    Array of string tags associated with this resource.

.customFields (object)
    Object of case-sensititve key-value pairs of custom fields 
    associated with the resource.

.fruits (string, one of 'apples', 'lemons')
    One of a list of acceptable fruits.

.location (LocationDocument)
    Object representing a location.
`;
      const derefSpec = await refParser.dereference(JSON.parse(JSON.stringify(SPEC)));
      const schemaName = 'ExampleDocument';

      const result = printFields.generateFieldsText(SPEC, derefSpec, schemaName);
      expect(result).to.equal(expected);
    });
  });

  describe('printSchema', () => {
    it('should print expected schema for a given schema name', async () => {
      const expected = `{
  "description": "An example document object.",
  "properties": {
    "name": {
      "type": "string",
      "description": "Friendly name of this resource."
    },
    "createdAt": {
      "type": "integer",
      "description": "Timestamp when the resource was created.",
      "readOnly": true
    },
    "tags": {
      "type": "array",
      "description": "Array of string tags associated with this resource.",
      "items": { "type": "string" }
    },
    "customFields": {
      "type": "object",
      "description": "Object of case-sensititve key-value pairs of custom fields associated with the resource."
    },
    "fruits": {
      "type": "string",
      "description": "One of a list of acceptable fruits.",
      "enum": ["apples", "lemons"]
    },
    "location": {
      "type": "object",
      "description": "Object representing a location."
    }
  }
}`;
      const derefSpec = await refParser.dereference(JSON.parse(JSON.stringify(SPEC)));
      const schemaName = 'ExampleDocument';

      const result = printSchema.generateSchemaText(derefSpec, schemaName);
      expect(result).to.equal(expected);
    });
  });
});


