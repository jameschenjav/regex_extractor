const { readFileSync } = require('fs');
const isSafeRegex = require('safe-regex');

const ROOT_PATH = `${__dirname}/out/`;
const JSON_FILES = ['js_fs', 'js_fs-online'];
// const JSON_FILES = ['rb_fs', 'rb_fs-online', 'rb_fs-auth'];

const main = () => {
  JSON_FILES.forEach((project) => {
    const jsonStr = readFileSync(`${ROOT_PATH}${project}.json`, { encoding: 'utf-8' });
    const { items } = JSON.parse(jsonStr);
    items.forEach(({ path, list }) => {
      list.filter(({ val }) => val).forEach(({ val, line, col }) => {
        if (isSafeRegex(val.slice(1, -1))) return;

        console.error(JSON.stringify({ project, path, line, col, regex: val }, null, 2));
      });
    })
  });
};

main();
