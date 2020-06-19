# RegEx Extractor

Extract RegEx from Ruby or JavaScript source code.

## Background

To prevent [ReDoS](https://en.wikipedia.org/wiki/ReDoS) we need to find out all the Regular Expressions in our codebase. This project is to help find all literal RegEx in Ruby or JavaScript source code.

## Extracting

### Ruby

Ruby provides `Parser::CurrentRuby` to parse Ruby code. It's very straightforward to use.

> Usage: `ROOT_PATH=<Your git root> ./find_rb_regexp.rb > out/rb_re.json`

### JavaScript

I have tried several different libs. There are the Pros and Cons:

1. `recast`: extract_regex.js

    * Pros: directly get all tokens, really fast
    * Cons: new syntax

2. `@babel/parser`: ext_regex.js

    * Pros: pretty fast
    * Cons: need to install `@babel/core` and plugins individually. the instruction is not very clear when it goes wrong. hard to configure.

3. `typescript`: ext_re.ts

    * Pros: all-in-one, no need other packages.
    * Cons: really slow. a little bit confusing how to use it.

> Usage: run `env ROOT_PATH=<Your git root> ./find_js_regexp.rb > out/js_re.json`

## Verifying

1. Fast check all RegEx with [safe-regex](https://github.com/substack/safe-regex)

    According to [this link](https://www.npmjs.com/package/vuln-regex-detector#how-is-this-module-different-from-safe-regex), `safe-regex` reports a lot **false positives**. Update `fast_check.js` and run `node fast_check.js`

2. Verify possible vulnerable RegEx with [vuln-regex-detector](https://github.com/davisjam/vuln-regex-detector#docker)

    This is really slow but accurate. Run it against all RegEx if possible.

    Follow the instruction to install docker. Then edit `tests/rb.json` or `test/js.json` and run:

    ```bash
    docker run --rm -v ${pwd}/tests:/tests vuln-regex-detector bin/check-regex.pl /tests/js.json
    ```

    Check `isVulnerable` then.

## Requirements

### Tools

* `git`: search files with `git ls-files`
* `ripgrep`: faster `grep` to filter files
* `ruby`: for Ruby
* `node`, `ts-node`, `yarn`: for JS
* [vuln-regex-detector](https://github.com/davisjam/vuln-regex-detector): RegEx vulnerability detection
* `docker` to run `vuln-regex-detector`

### Installation

1. clone this repo and run `yarn` inside the folder
2. Follow [this link](https://www.npmjs.com/package/vuln-regex-detector#how-is-this-module-different-from-safe-regex) to install `vuln-regex-detector`
