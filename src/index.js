/** Top level commands **/
const COMMANDS = {
  join: require('./commands/join'),
  lint: require('./commands/lint'),
  print: require('./commands/print'),
  split: require('./commands/split'),
  validate: require('./commands/validate'),
};

/**
 * The main function.
 */
const main = async () => {
  const [, , cmd, param1, param2, param3, param4] = process.argv;

  if (!COMMANDS[cmd]) {
    console.log(`Invalid command, choose from:\n  ${Object.keys(COMMANDS).join('\n  ')}`);
    return;
  }

  try {
    await COMMANDS[cmd].execute(param1, param2, param3, param4);
  } catch (e) {
    console.log(e);
  }
};

main();
