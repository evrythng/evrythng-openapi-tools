const join = require('./commands/join');
const split = require('./commands/split');
const validate = require('./commands/validate');
const printDefinition = require('./commands/printDefinition');
const printFields = require('./commands/printFields');
const printSchema = require('./commands/printSchema');
const printOperation = require('./commands/printOperation');
const lint = require('./commands/lint');

const COMMANDS = {
  join,
  split,
  validate,
  lint,
  'print-definition': printDefinition,
  'print-fields': printFields,
  'print-schema': printSchema,
  'print-operation': printOperation,
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
