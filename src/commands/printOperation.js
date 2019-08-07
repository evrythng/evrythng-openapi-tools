const refParser = require('json-schema-ref-parser');
const yamlJs = require('yamljs');

let spec;

/**
 * Build a map of operations to their path and method.
 *
 * @returns {object[]} List of objects containing operation, path, method.
 */
const buildOperationMap = () => {
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

/**
 * Print the operation's summary as a preamble.
 *
 * @param {object} data - Operation data.
 */
const printPreamble = ({ operation, method }) =>
  console.log(`\n## ${operation.summary}\n\n${operation.description}`);

/**
 * Adapt OpenAPI path templating to ReadMe.io templating.
 *
 * @param {string} path - The path to transform, such as '/thngs/{thngId}'.
 * @returns {string} Transformed path, such as '/thng:thngId'.
 */
const fixupPath = path => path.replace('{', ':').replace('}', '');

/**
 * Get information used to look up a schema.
 *
 * @param {object} parent - The schema's parent object.
 * @returns {object} Object containing response schema's type and its name.
 */
const getSchemaLookupInfo = (parent) => {
  let $ref;
  if (parent.$ref) {
    // Simple schema use
    $ref = parent.$ref;
  } else if(parent.content) {
    let schema;

    // Complex schema use
    schema = parent.content['application/json'].schema;
    if (!schema) {
      throw new Error(`${JSON.stringify(parent)} had no schema!`);
    }

    $ref = schema.$ref;
  } else {
    // ???
    throw new Error(`${JSON.stringify(parent)} had no found schema of any kind!`);
  }

  const [, , type, schemaName] = $ref.split('/');
  return { type, schemaName };
};

/**
 * Generate an HTTP example snippet.
 *
 * @param {object} data - Data about the operation.
 * @returns {string} Formatted HTTP snippet.
 */
const generateHttpSnippet = (data) => {
  const { operation, method, path } = data;
  let result = `${method.toUpperCase()} ${fixupPath(path)}\n`;
  if (['post', 'put'].includes(method)) {
    result += 'Content-Type: application/json';
  }

  result += `\nAuthorization: $API_KEY`;

  const { requestBody } = operation;
  if (requestBody) {
    const { schemaName } = getSchemaLookupInfo(requestBody);
    result += `\n\n${schemaName}`;

    if (method === 'put') {
      result += ' (partial)';
    }
  }

  return result;
};

/**
 * Generate an cURL example snippet.
 *
 * @param {object} data - Data about the operation.
 * @returns {string} Formatted cURL snippet.
 */
const generateCurlSnippet = (data) => {
  const { operation, method, path } = data;
  let result = 'curl -i';
  if (['post', 'put'].includes(method)) {
    result += ' -H Content-Type:application/json';
  }

  result += ' \\\n  -H Authorization:$API_KEY \\\n';
  result += `  -X ${method.toUpperCase()} https://api.evrythng.com${fixupPath(path)} \\\n`;

  const { requestBody } = operation;
  if (operation.requestBody) {
    const { schemaName, type } = getSchemaLookupInfo(requestBody);

    let example;
    if (type === 'schemas') {
      example = operation.requestBody.content['application/json'].example;
    } else {
      // Find the example
      const schemaData = spec.components[type][schemaName];
      if (!schemaData) {
        throw new Error(`${path} has no schemaData in ${type}!`);
      }

      if (schemaData.content && schemaData.content['application/json']) {
        example = schemaData.content['application/json'].example;
        if (!example) {
          throw new Error(`${schemaName} has no example!`);
        }
      } else {
        throw new Error('Unable to extract example');
      }
    }

    result += `  -d '${JSON.stringify(example, null, 2)}'`;
  }

  return result;
};

/**
 * Look up human-friendly HTTP code response texts.
 *
 * @param {number} responseCode - HTTP response code.
 * @returns {string} Human-friendly response text.
 */
const getResponseText = (responseCode) => {
  const map = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    301: 'Temporary Redirect',
  };

  return map[responseCode];
};

/**
 * Generate the Response example snippet.
 *
 * @param {object} data - Data about the operation.
 * @returns {string} Formatted Response snippet.
 */
const generateResponseSnippet = (data) => {
  const { operation, method, path } = data;

  // Take the one and only response
  const [responseCode] = Object.keys(operation.responses);
  const { type, schemaName } = getSchemaLookupInfo(operation.responses[responseCode]);

  let result = `HTTP/1.1 ${responseCode} ${getResponseText(responseCode)}\n`;
  result += 'Content-Type: application/json\n\n';

  // TODO: Get and print the example

  return result;
};

/**
 * Print a ReadMe.io format data block.
 *
 * @param {object} readMeData - ReadMe format JSON data.
 */
const printReadMeDataBlock = readMeData =>
  console.log(`[block:code]\n${JSON.stringify(readMeData, null, 2)}\n[/block]`);

/**
 * Print the various request example snippets.
 *
 * @param {object} data - Data about the operation.
 * @returns {string} Formatted request snippet in multiple languages.
 */
const printRequest = data => printReadMeDataBlock({
  codes: [{
    language: 'http',
    code: generateHttpSnippet(data),
  }, {
    name: 'evrythng-cli',
    language: 'text',
    code: 'TODO',
  }, {
    language: 'curl',
    code: generateCurlSnippet(data),
  }, {
    name: 'evrythng.js',
    language: 'javascript',
    code: 'TODO',
  }],
});

/**
 * Print the operation response.
 *
 * @param {object} data - Data about the operation.
 * @returns {string} Formatted response snippets.
 */
const printResponse = data => printReadMeDataBlock({
  codes: [{
    language: 'http',
    code: generateResponseSnippet(data),
  }],
});

/**
 * Print the operation snippets.
 *
 * @param {string} summary - The operation summary to find.
 */
const printOperation = (summary) => {
  const map = buildOperationMap();
  const found = map.find(p => p.operation.summary === summary);
  if (!found) {
    throw new Error('Summary not found');
  }

  printPreamble(found);
  printRequest(found);
  printResponse(found);
};

/**
 * Print a ReadMe.io format request/response pair.
 */
const execute = async (specPath, summary, rest) => {
  spec = yamlJs.load(specPath);
  if (!summary) {
    console.log('Please specify an operation summary, such as \'Read all Thngs\'.');
    return;
  }

  console.log();
  printOperation(summary);
  console.log('\n\n>>> Please be aware this output still needs some editing (API key, schema name etc)\n');
};

module.exports = {
  execute,
};
