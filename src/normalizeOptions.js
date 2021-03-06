'use strict';

exports.__esModule = true;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _reselect = require('reselect');

var _findBabelConfig = require('find-babel-config');

var _findBabelConfig2 = _interopRequireDefault(_findBabelConfig);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _pkgUp = require('pkg-up');

var _pkgUp2 = _interopRequireDefault(_pkgUp);

var _resolvePath = require('./resolvePath');

var _resolvePath2 = _interopRequireDefault(_resolvePath);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const defaultExtensions = ['.js', '.jsx', '.css','.scss', '.jpeg', '.png', '.gif', '.es', '.es6', '.mjs'];
const defaultTransformedFunctions = ['require', 'require.resolve', 'System.import',

// Jest methods
'jest.genMockFromModule', 'jest.mock', 'jest.unmock', 'jest.doMock', 'jest.dontMock', 'jest.setMock', 'require.requireActual', 'require.requireMock'];

function isRegExp(string) {
  return string.startsWith('^') || string.endsWith('$');
}

const specialCwd = {
  babelrc: startPath => _findBabelConfig2.default.sync(startPath).file,
  packagejson: startPath => _pkgUp2.default.sync(startPath)
};

function normalizeCwd(optsCwd, currentFile) {
  let cwd;

  if (optsCwd in specialCwd) {
    const startPath = currentFile === 'unknown' ? './' : currentFile;

    const computedCwd = specialCwd[optsCwd](startPath);

    cwd = computedCwd ? _path2.default.dirname(computedCwd) : null;
  } else {
    cwd = optsCwd;
  }

  return cwd || process.cwd();
}

function normalizeRoot(optsRoot, cwd) {
  if (!optsRoot) {
    return [];
  }

  const rootArray = Array.isArray(optsRoot) ? optsRoot : [optsRoot];

  return rootArray.map(dirPath => _path2.default.resolve(cwd, dirPath)).reduce((resolvedDirs, absDirPath) => {
    if (_glob2.default.hasMagic(absDirPath)) {
      const roots = _glob2.default.sync(absDirPath).filter(resolvedPath => _fs2.default.lstatSync(resolvedPath).isDirectory());

      return [...resolvedDirs, ...roots];
    }

    return [...resolvedDirs, absDirPath];
  }, []);
}

function getAliasPair(key, value) {
  const parts = value.split('\\\\');

  function substitute(execResult) {
    return parts.map(part => part.replace(/\\\d+/g, number => execResult[number.slice(1)] || '')).join('\\');
  }

  return [new RegExp(key), substitute];
}

function normalizeAlias(optsAlias) {
  if (!optsAlias) {
    return [];
  }

  const aliasKeys = Object.keys(optsAlias);

  return aliasKeys.map(key => isRegExp(key) ? getAliasPair(key, optsAlias[key]) : getAliasPair(`^${key}(/.*|)$`, `${optsAlias[key]}\\1`));
}

function getSitesPair(key, value) {
  const parts = value.split('\\\\');

  return [key, value];
}
function normalizeSites(optsSites, envName) {
  if (!optsSites) {
    console.error("No Sites has defined!, You can remove this plugin if you dont have any sites");
    return {};
  }
  if (envName && optsSites[process.env[envName]]) {
    return optsSites[process.env[envName]];
  } else {
    return optsSites.default || {};
  }
}

function normalizeTransformedFunctions(optsTransformFunctions) {
  if (!optsTransformFunctions) {
    return defaultTransformedFunctions;
  }

  return [...defaultTransformedFunctions, ...optsTransformFunctions];
}

exports.default = (0, _reselect.createSelector)(
// The currentFile should have an extension; otherwise it's considered a special value
currentFile => currentFile.includes('.') ? _path2.default.dirname(currentFile) : currentFile, (_, opts) => opts, (currentFile, opts) => {
  const cwd = normalizeCwd(opts.cwd, currentFile);
  const root = normalizeRoot(opts.root, cwd);
  const site = normalizeSites(opts.vars, opts.envName);
  const defaultSite = opts.vars.default;
  const transformFunctions = normalizeTransformedFunctions(opts.transformFunctions);
  const extensions = opts.extensions || defaultExtensions;
  const resolvePath = opts.resolvePath || _resolvePath2.default;

  return {
    cwd,
    root,
    site,
    defaultSite,
    transformFunctions,
    extensions,
    resolvePath
  };
});