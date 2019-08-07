const join = require('./commands/join');
const split = require('./commands/split');
const validate = require('./commands/validate');
const printFields = require('./commands/printFields');
const printSchema = require('./commands/printSchema');
const printOperation = require('./commands/printOperation');
const lint = require('./commands/lint');

/**
 * The main function.
 */
const main = () => {
  const [, , cmd, param1, param2] = process.argv;
  const rest = process.argv.splice(5);

  const map = {
    join,
    split,
    validate,
    lint,
    'print-fields': printFields,
    'print-schema': printSchema,
    'print-operation': printOperation,
  };
  if (!map[cmd]) {
    console.log(`Invalid command, choose from ${Object.keys(map).join(', ')}`);
    return;
  }

  try {
    map[cmd].execute(param1, param2, rest);
  } catch (e) {
    console.log(e);
  }
};

main();
