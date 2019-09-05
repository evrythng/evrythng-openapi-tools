const join = require('./commands/join');
const lint = require('./commands/lint');
const printApiStatus = require('./commands/printApiStatus');
const printDefinition = require('./commands/printDefinition');
const printFields = require('./commands/printFields');
const printOperation = require('./commands/printOperation');
const printSchema = require('./commands/printSchema');
const split = require('./commands/split');
const validate = require('./commands/validate');

const COMMANDS = {
  join,
  split,
  validate,
  lint,
  'print-api-status': printApiStatus,
  'print-definition': printDefinition,
  'print-fields': printFields,
  'print-operation': printOperation,
  'print-schema': printSchema,
};

/**
 * The main function.
 */
const main = () => {
  const [, , cmd, param1, param2, param3] = process.argv;
  const rest = process.argv.splice(6);

  if (!COMMANDS[cmd]) {
    console.log(`Invalid command, choose from:\n  ${Object.keys(COMMANDS).join('\n  ')}`);
    return;
  }

  try {
    COMMANDS[cmd].execute(param1, param2, param3, rest);
  } catch (e) {
    console.log(e);
  }
};

main();
