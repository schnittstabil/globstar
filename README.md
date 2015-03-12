globstar [![Build Status](https://travis-ci.org/schnittstabil/globstar.svg?branch=master)](https://travis-ci.org/schnittstabil/globstar) [![Coverage Status](https://coveralls.io/repos/schnittstabil/globstar/badge.svg?branch=master)](https://coveralls.io/r/schnittstabil/globstar?branch=master)
========

Run programs with glob/globstar support, especially on Windows within npm scripts.

Install
-------

```sh
[sudo] npm install globstar --global
```

Usage
-----

```sh
> globstar -- echo "**/globstar.js"
node_modules/globstar/globstar.js
```

Please note the `--` and that globstar uses forward slashes.

npm Scripts
-----------

```sh
$ npm install globstar --save-dev

// e.g. install some linter
$ npm install eslint --save-dev
$ npm install editorconfig-tools --save-dev
```

Please note that Windows needs double quotes:

```json
  "scripts": {
    "lint": "npm run -s lint-js && npm run -s lint-ec",
    "lint-js": "globstar --node -- eslint \"**/*.js\"",
    "lint-ec": "globstar --node -- editorconfig-tools check \"**/*.js\""
  },
```

Lint your `**/*.js` files:

```sh
$ npm run lint
```

Options
-------

```
$ globstar --help
Run programs with globstar support.

Usage: globstar [OPTION]... -- COMMAND [ARG]...
Note the -- between the globstar OPTIONS and the COMMAND and its arguments

Options:
  --nodir        glob patterns do not match directories, only files
  -i, --ignore   add glob pattern to exclude from matches
  -n, --node     same as `--ignore "node_modules/**"`
  -v, --verbose  explain what is being done
  --version      display version information
  --help         Show help

Report globstar bugs to <https://github.com/schnittstabil/globstar/issues>
globstar home page: <https://github.com/schnittstabil/globstar>
```

License
-------

Copyright © 2015 Michael Mayer

Licensed under the [MIT license](LICENSE).
