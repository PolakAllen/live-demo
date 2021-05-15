
const path = require('path');
const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
const paths = {
    build: resolveApp('build'),
    src: resolveApp('src'),
    node_modules: resolveApp('node_modules'),
    entry: resolveApp('src/main/index.tsx'),
    html: resolveApp('src/main/index.html'),
    babelConfig: resolveApp('config/babel.config.json')
}
console.log('App paths:', paths);

module.exports = paths;