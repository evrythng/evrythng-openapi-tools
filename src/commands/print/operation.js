const yamlJs = require('yamljs');
const { buildOperationMap, generateReadMeWidget } = require('../../util');

/**
 * Print the operation's summary as a preamble.
 *
 * @param {object} data - Operation data.
 * @returns {string} Preamble in full.
 */
const generatePreamble = ({ operation, method }) =>
  `## ${operation.summary}\n\n${operation.description}`;

/**
 * Adapt OpenAPI path templating to ReadMe.io templating.
 *
 * @param {string} path - The path to transform, such as '/thngs/{thngId}'.
 * @returns {string} Transformed path, such as '/thngs/:thngId'.
 */
const fixupPath = path => path.split('{').join(':').split('}').join('');

/**
 * Get information used to look up a schema.
 *
 * @param {object} parent - The schema's parent object.
 * @returns {object} Object containing response schema's type and its name.
 */
const getSchemaLookupInfo = (parent) => {
  if (!parent.content) {
    throw new Error('responseBody content not implemented!');
  }

  const { schema } = parent.content['application/json'];
  if (!schema) {
    throw new Error(`${JSON.stringify(parent)} had no schema!`);
  }

  // Handle arrays
  let { $ref }  = schema;
  if (schema.type === 'array') {
    if (!schema.items.$ref) {
      throw new Error('Array type items are not defined with $ref');
    }

    ({ $ref } = schema.items);
  }

  const [, , type, schemaName] = $ref.split('/');
  return { type, schemaName };
};

/**
 * Take an opinionated guess as to which API key can be used, based on x-api-keys
 *
 * @param {object} operation - The operation object.
 * @returns {string} API key placeholder name.
 */
const getApiKeyType = (operation) => {
  const keys = operation['x-api-keys'];
  if (!keys) {
    return 'OPERATOR_API_KEY';
  }

  if (keys.includes('Operator')) {
    return 'OPERATOR_API_KEY';
  }
  if (keys.includes('Trusted Application')) {
    return 'TRUSTED_APPLICATION_API_KEY';
  }
  if (keys.includes('Application')) {
    return 'APPLICATION_API_KEY';
  }
  if (keys.includes('Application User')) {
    return 'APPLICATION_USER_API_KEY';
  }
  if (keys.includes('Device')) {
    return 'DEVICE_API_KEY';
  }

  return 'OPERATOR_API_KEY';
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
    result += 'Content-Type: application/json\n';
  }

  result += `Authorization: $${getApiKeyType(operation)}`;

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

  result += ` \\\n  -H Authorization:$${getApiKeyType(operation)} \\\n`;
  result += `  -X ${method.toUpperCase()} https://api.evrythng.com${fixupPath(path)}`;

  const { requestBody } = operation;
  if (operation.requestBody) {
    const { schemaName, type } = getSchemaLookupInfo(requestBody);

    const { example } = operation.requestBody.content['application/json'];
    if (!example) {
      throw new Error('requestBody has no example!');
    }

    result += ` \\\n  -d '${JSON.stringify(example, null, 2)}'`;
  }

  return result;
};

/**
 * Transform JSON string to JS object string.
 *
 * {               >  {
 *   "foo": "bar"  >    foo: 'bar'
 * }               >  }
 *
 * @param {string} jsonStr - String input.
 * @returns {string} JS object string.
 */
const formatJsonForJs = jsonStr => jsonStr
  .split('\n')
  .map((line) => {
    line = line.split('": ').join(': ');
    if (line.includes(':')) {
      line = line.split('  "').join('  ');
    }

    return line.split('"').join('\'');
  }).join('\n') + ';\n\n';

/**
 * Generate an evrythng.js example snippet (or starting point).
 *
 * @param {object} data - Data about the operation.
 * @returns {string} Formatted evrythng.js snippet.
 */
const generateJsSnippet = (data) => {
  const { operation, method, path } = data;
  let result = '';

  // Add a payload object
  const { requestBody } = operation;
  if (requestBody) {
    result += 'const payload = ';

    const { example } = operation.requestBody.content['application/json'];
    if (!example) {
      throw new Error('requestBody has no example!');
    }

    result += formatJsonForJs(JSON.stringify(example, null, 2));
  }

  // Add the operation
  result += 'operator.TYPE()';

  // Add the method
  const map = {
    post: '.create(payload)',
    get: '.read()',
    put: '.update(payload)',
    delete: '.delete();'
  };
  result += map[method];

  // Lastly
  if (method !== 'delete') {
    result += '\n  .then(console.log);';
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
  const response = operation.responses[responseCode];

  let result = `HTTP/1.1 ${responseCode} ${getResponseText(responseCode)}\n`;
  if (['post', 'get', 'put'].includes(method)) {
    result += 'Content-Type: application/json';
  }

  result += '\n\n';

  // Get and print the example response
  if (response.content) {
    const { example } = response.content['application/json'];
    if (!example) {
      throw new Error(`No example implemented for response ${responseCode}`);
    }

    result += JSON.stringify(example, null, 2);
  }
  return result;
};

/**
 * Print the various request example snippets.
 *
 * @param {object} data - Data about the operation.
 * @returns {string} Formatted request snippet in multiple languages.
 */
const generateRequest = data => generateReadMeWidget('code', {
  codes: [{
    language: 'http',
    code: generateHttpSnippet(data),
  }, {
    language: 'curl',
    code: generateCurlSnippet(data),
  }, {
    name: 'evrythng.js',
    language: 'javascript',
    code: generateJsSnippet(data),
  }],
});

/**
 * Print the operation response.
 *
 * @param {object} data - Data about the operation.
 * @returns {string} Formatted response snippets.
 */
const generateResponse = data => generateReadMeWidget('code', {
  codes: [{
    language: 'http',
    code: generateResponseSnippet(data),
    name: 'Response',
  }],
});

/**
 * Print the operation snippets.
 *
 * @param {object} spec - The API spec.
 * @param {string} summary - The operation summary to find.
 * @returns {string} The operation snippet in full.
 */
const generateOperationText = (spec, summary) => {
  const map = buildOperationMap(spec);
  const found = map.find(p => p.operation.summary === summary);
  if (!found) {
    throw new Error('Summary not found');
  }

  return `${generatePreamble(found)}\n${generateRequest(found)}\n${generateResponse(found)}\n___\n\n`;
};

/**
 * Print a ReadMe.io format request/response pair.
 *
 * @param {string} specPath - The path to the OpenAPI spec file.
 * @param {string} summary - Summary to use for operation search.
 */
const execute = async (specPath, summary) => {
  const spec = yamlJs.load(specPath);
  if (!summary) {
    console.log('Please specify an operation summary, such as \'Read all Thngs\'.');
    return;
  }

  console.log(generateOperationText(spec, summary));
  console.log('\n\n>>> Please be aware this output still needs some editing (API keys, \'See also\', Example, etc)\n');
};

module.exports = {
  execute,
  generateOperationText,
};
