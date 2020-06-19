const { argv, stdin } = require('process');
const { readFileSync } = require('fs');
const { parse } = require('@babel/parser');

const BABEL_OPTION = {
  sourceType: "module",
  tokens: true,
  classProperties: true,
  plugins: [
    ['classProperties', require('@babel/plugin-proposal-class-properties')],
  ],
};

const extractJS = (filename) => {
  const source = readFileSync(filename, { encoding: 'utf-8' });
  if (typeof filename === 'string' && filename.endsWith('.vue')) {
    const lines = source.split('\n');

    const trimmedLines = lines.map((ln) => ln.trim());
    const begin = trimmedLines.indexOf('<script>');
    const end = trimmedLines.indexOf('</script>', begin + 1);
    if (begin < 0 && end < 0) {
      return { source: '', base: 0 };
    }

    if (begin && end) {
      const base = begin + 1;
      return { source: lines.slice(base, end).join('\n'), base };
    }
  }
  return { source, base: 0 };
};

const extractRegExpressions = (sourceFile) => {
  try {
    const { source, base } = extractJS(sourceFile);
    const code = parse(source, BABEL_OPTION);
    const list = code.tokens
      .filter(({ type }) => type.label === 'regexp')
      .map(({ start, end, loc: { start: { line: ln, column: col } } }) => ({
        line: base + ln,
        col,
        val: source.slice(start, end),
      }));
    console.log(JSON.stringify(list, null, 2));
  } catch (e) {
    console.error(`Error when parsing file ${sourceFile}:`, e);
  }
};

extractRegExpressions(argv[2] || stdin.fd);
