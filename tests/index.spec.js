const { expect } = require('chai');
const refParser = require('json-schema-ref-parser');
const printFields = require('../src/commands/print/fields');
const printSchema = require('../src/commands/print/schema');
const printOperation = require('../src/commands/print/operation');
const printApiStatus = require('../src/commands/print/apiStatus');

const SPEC = require('./testSpec.json');

describe('evrythng-openapi-tools', () => {
  describe('printFields', () => {
    it('should print expected fields for a given schema name', async () => {
      // Note trailing space after 'custom fields' is expected from the wrapping
      const expected = `.name (string, required)
    Friendly name of this resource.

.createdAt (integer, read-only)
    Timestamp when the resource was created.

.tags (array of string)
    Array of string tags associated with this resource.

.customFields (object)
    Object of case-sensititve key-value pairs of custom fields 
    associated with the resource.

.fruits (string, required, one of 'apples', 'lemons')
    One of a list of acceptable fruits.

.location (LocationDocument, required)
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
  "required": ["name", "fruits", "location"],
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

  describe('printApiStatus', () => {
    it('should print expected API Status snippet', async () => {
      const expected = `**API Status**
Beta:
\`/examplePath\`
General Availability:
\`/examplePath/{exampleId}\`
___`;

      const result = printApiStatus.generateApiStatusText(SPEC, 'Examples');
      expect(result).to.equal(expected);
    });
  });

  describe('printOperation', () => {
    it('should print expected operation snippet', async () => {
      const expected = `___


## Create an example

Create a new example.
[block:code]
{
  "codes": [
    {
      "language": "http",
      "code": "POST /examplePath/:exampleId\\nContent-Type: application/json\\nAuthorization: $OPERATOR_API_KEY\\n\\nExampleDocument"
    },
    {
      "language": "curl",
      "code": "curl -i -H Content-Type:application/json \\\\\\n  -H Authorization:$OPERATOR_API_KEY \\\\\\n  -X POST https://api.evrythng.com/examplePath/:exampleId\\\\\\n  -d '{\\n  \\"name\\": \\"Some example object\\",\\n  \\"tags\\": [\\n    \\"example\\"\\n  ],\\n  \\"fruits\\": [\\n    \\"apples\\",\\n    \\"pairs\\"\\n  ],\\n  \\"location\\": {\\n    \\"type\\": \\"Point\\",\\n    \\"coordinates\\": [\\n      -0.9,\\n      -51.1\\n    ]\\n  }\\n}'"
    },
    {
      "name": "evrythng.js",
      "language": "javascript",
      "code": "const payload = {\\n  name: 'Some example object',\\n  tags: [\\n    'example'\\n  ],\\n  fruits: [\\n    'apples',\\n    'pairs'\\n  ],\\n  location: {\\n    type: 'Point',\\n    coordinates: [\\n      -0.9,\\n      -51.1\\n    ]\\n  }\\n};\\n\\noperator.TYPE().create(payload)\\n  .then(console.log);"
    }
  ]
}
[/block]
[block:code]
{
  "codes": [
    {
      "language": "http",
      "code": "HTTP/1.1 200 OK\\nContent-Type: application/json\\n\\n{\\n  \\"name\\": \\"Some example object\\",\\n  \\"createdAt\\": 1568109267732,\\n  \\"tags\\": [\\n    \\"example\\"\\n  ],\\n  \\"fruits\\": [\\n    \\"apples\\",\\n    \\"pairs\\"\\n  ],\\n  \\"location\\": {\\n    \\"type\\": \\"Point\\",\\n    \\"coordinates\\": [\\n      -0.9,\\n      -51.1\\n    ]\\n  }\\n}",
      "name": "Response"
    }
  ]
}
[/block]`;

      const result = printOperation.generateOperationText(SPEC, 'Create an example');
      expect(result).to.equal(expected);
    });
  });
});
