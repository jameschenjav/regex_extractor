import { argv } from 'process';
import { readFileSync } from 'fs';
import { createSourceFile, ScriptTarget, SyntaxKind, Node } from 'typescript';

const extractJS = (filename: string | number): { source: string, base: number } => {
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

const createContext = (filename: string | number) => {
  const { source, base } = extractJS(filename);

  const src = createSourceFile('', source, ScriptTarget.ES2020);
  const list: { val: string, line: number, col: number }[] = [];

  const walk = (node: Node): void => {
    node.forEachChild(walk);
    if (node.kind !== SyntaxKind.RegularExpressionLiteral) return;

    const val = node.getText(src);
    const { line, character } = src.getLineAndCharacterOfPosition(node.pos);
    list.push({ val, line: line + base + 1, col: character + 1 });
  };

  return { src, list, walk };
}

const extractRegExpressions = (sourceFile: string | number): void => {
  try {
    const { src, list, walk } = createContext(sourceFile);
    src.statements.forEach(walk);

    console.log(JSON.stringify(list, null, 2));
  } catch (e) {
    console.error(`Error when parsing file ${sourceFile}:`, e);
  }
};

extractRegExpressions(argv[2] || 0);
