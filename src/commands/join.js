const { existsSync, readdirSync, writeFileSync } = require('fs');
const yamlJs = require('yamljs');

const OUTPUT_NAME = `openapi`;
const INDENT = 2;
const INLINE_AFTER = Infinity;

let baseSpec;

/**
 * Get a file name from a fileName.extension string.
 *
 * @param {string} str - The full file name to split.
 * @returns {string} The file name until '.'
 */
const getFileName = str => str.split('.')[0];

/**
 * Merge all items from the specified repo's /paths /components/schemas
 * /components/parameters /components/requestBodies in its base directory.
 *
 * @param {string} repoPath - Path to the repo to merge.
 */
const mergeRepoSpec = (repoPath) => {
  const specDir = `${repoPath}`;
  console.log(`Reading from ${specDir}`);

  const pathsDir = `${specDir}/paths`;
  readdirSync(pathsDir).map(getFileName).forEach((path) => {
    baseSpec.paths[`/${path.replace(/-/g, '/')}`] = yamlJs.load(`${pathsDir}/${path}.yaml`);
  });

  const schemasDir = `${specDir}/components/schemas`;
  if (existsSync(schemasDir)) {
    readdirSync(schemasDir).map(getFileName).forEach((name) => {
      baseSpec.components.schemas[name] = yamlJs.load(`${schemasDir}/${name}.yaml`);
    });
  }

  const parametersDir = `${specDir}/components/parameters`;
  if (existsSync(parametersDir)) {
    readdirSync(parametersDir).map(getFileName).forEach((name) => {
      baseSpec.components.parameters[name] = yamlJs.load(`${parametersDir}/${name}.yaml`);
    });
  }

  const requestBodiesDir = `${specDir}/components/requestBodies`;
  if (existsSync(requestBodiesDir)) {
    readdirSync(requestBodiesDir).map(getFileName).forEach((name) => {
      baseSpec.components.requestBodies[name] = yamlJs.load(`${requestBodiesDir}/${name}.yaml`);
    });
  }
};

/**
 * Merge the otherDirs spec components and paths into the baseDir spec, then
 * write output files in YAML and JSON.
 *
 * @param {string} baseDir - The base directory to build from, containing base.yaml etc.
 * @param {string} outputDir - Directory to store joined output files.
 * @param {string[]} rest - Rest of program args.
 */
const execute = (baseDir, outputDir, rest) => {
  if (!baseDir) {
    throw new Error('Specify a base directory where base.yaml resides.');
  }

  baseSpec = yamlJs.load(`${baseDir}/base.yaml`);
  if (!outputDir) {
    throw new Error('Specify an output directory');
  }

  mergeRepoSpec(baseDir);

  if (rest) {
    rest.forEach(mergeRepoSpec);
  }

  const yamlStr = yamlJs.stringify(baseSpec, INLINE_AFTER, INDENT);
  writeFileSync(`${outputDir}/${OUTPUT_NAME}.yaml`, yamlStr, 'utf8');
  console.log(`Wrote ${outputDir}/${OUTPUT_NAME}.yaml`);
  writeFileSync(`${outputDir}/${OUTPUT_NAME}.json`, JSON.stringify(baseSpec, null, INDENT), 'utf8');
  console.log(`Wrote ${outputDir}/${OUTPUT_NAME}.json`);
};

module.exports = {
  execute,
};
