const { writeFileSync } = require('fs');
const { execSync } = require('child_process');
const yamlJs = require('yamljs');

/**
 * Split an input YAML Open API 3.0 spec into individual files for paths and components.
 * An API base.yaml with core OpenAPI 3.0 data will also be created.
 *
 * @param {string} inputFile - Path of the input file to split.
 * @param {string} outputDir - Path of the output directory to save files produced.
 */
const execute = (inputFile, outputDir) => {
  if (!inputFile) {
    throw new Error('Specify name of the file to split.');
  }

  if (!outputDir) {
    throw new Error('Specify output directory');
  }

  const pathsDir = `${outputDir}/paths`;
  const schemasDir = `${outputDir}/components/schemas`;
  const parametersDir = `${outputDir}/components/parameters`;
  const requestBodiesDir = `${outputDir}/components/requestBodies`;
  const outputPath = `${outputDir}/base.yaml`;
  execSync(`mkdir -p ${pathsDir} ${schemasDir} ${parametersDir} ${requestBodiesDir}`);

  // Core spec
  const spec = yamlJs.load(inputFile);
  const coreSpec = JSON.parse(JSON.stringify(spec));
  coreSpec.paths = {};
  coreSpec.components.schemas = {};
  coreSpec.components.parameters = {};
  coreSpec.components.requestBodies = {};
  writeFileSync(outputPath, yamlJs.stringify(coreSpec, 99, 2), 'utf8');

  // Schemas
  Object.keys(spec.components.schemas).forEach((name) => {
    const fragment = yamlJs.stringify(spec.components.schemas[name], 99, 2);
    writeFileSync(`${schemasDir}/${name}.yaml`, fragment, 'utf8');
  });

  // Parameters
  if (spec.components.parameters) {
    Object.keys(spec.components.parameters).forEach((name) => {
      const fragment = yamlJs.stringify(spec.components.parameters[name], 99, 2);
      writeFileSync(`${parametersDir}/${name}.yaml`, fragment, 'utf8');
    });
  }

  // Paths
  Object.keys(spec.paths).forEach((path) => {
    const fileName = path.split('/').filter(p => p.length).join('-');
    const fragment = yamlJs.stringify(spec.paths[path], 99, 2);
    writeFileSync(`${pathsDir}/${fileName}.yaml`, fragment, 'utf8');
  });

  // RequestBodies
  if (spec.components.requestBodies) {
    Object.keys(spec.components.requestBodies).forEach((name) => {
      const fragment = yamlJs.stringify(spec.components.requestBodies[name], 99, 2);
      writeFileSync(`${requestBodiesDir}/${name}.yaml`, fragment, 'utf8');
    });
  }
};

module.exports = {
  execute,
};
