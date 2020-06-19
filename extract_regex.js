const { argv, stdin } = require('process');
const { readFileSync } = require('fs');
const { parse } = require('recast');

const extractRegExpressions = (sourceFile) => {
  try {
    const source = readFileSync(sourceFile, { encoding: 'utf-8' });
    const code = parse(source);
    const list = code.tokens
      .filter(({ type }) => type === 'RegularExpression')
      .map(({ value: val, loc: { start: { line, column: col } } }) => ({ line, col, val }));
    console.log(JSON.stringify(list, null, 2));
  } catch (e) {
    console.error(`Error when parsing file ${sourceFile}:`, e);
  }
};

extractRegExpressions(argv[2] || stdin.fd);
