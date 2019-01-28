const path = require('path');
const fs = require('fs');

const PLUGIN_NAME = 'ReactConfigRouterWebpackPlugin';
const CONFIG_FILE_NAME = 'config.router.js';

class ReactConfigRouterWebpackPlugin {
  constructor(options) {
    const userOptions = options || {};
    const appSrc = path.resolve(path.join(__dirname.slice(0, __dirname.indexOf('node_modules') + 1), 'src'));
    const configSrc = (path.join(appSrc.slice(), CONFIG_FILE_NAME));
    const defaultOptions = {appSrc, configSrc};
    const isCustomRouter = fs.existsSync(configSrc);

    if (!userOptions.pageSrc) {
      defaultOptions.pageSrc = path.join(appSrc, 'pages')
    }

    this.options = Object.assign(defaultOptions, userOptions);
  }

  addExport(configStr) {
    return (` 
module.exports = [
  ${configStr}
]`
    )
  }

  addModule(name, relativePath) {
    return (`
  {
    path: '/${name}',
     component: require('./${relativePath}').default
   }
    `)
  }

  addNestModule(layoutPath, routes) {
    return (
      `
{
  path: '/${layoutPath}',
  component: require('./${layoutPath}/index.js').default,
  routes: [
    ${routes}
  ]
}
      `
    )
  }

  genRouterConfig(pageSrc, appSrc) {
    const files = fs.readdirSync(pageSrc, {withFileTypes: true});
    const isNest = files.some(item => item.name === 'index.js');

    const routes = [];
    for (const file of files) {
      const _name = file.name;
      if (file.name === 'index.js') continue;
      if (file.isDirectory()) {
        const mod = this.genRouterConfig(path.join(pageSrc.slice(), file.name), appSrc);
        routes.push(mod)
      } else {
        const mod = isNest ? this.addModule(path.join(pageSrc.slice(pageSrc.indexOf('pages') + 6), path.parse(_name).name.toLowerCase()), path.join(pageSrc.slice(pageSrc.indexOf('src') + 4), _name)) : this.addModule(path.parse(_name).name.toLowerCase(), path.join(pageSrc.slice(pageSrc.indexOf('src') + 4), _name));
        routes.push(mod)
      }
    }
    if (isNest) {
      return this.addNestModule(pageSrc.slice(pageSrc.indexOf('pages') + 6), routes)
    }
    return this.addExport(routes)
  }

  apply(compiler) {
    compiler.hooks.watchRun.tap(PLUGIN_NAME, compilation => {
      const r = this.genRouterConfig(this.options.pageSrc, this.options.appSrc);
      fs.writeFileSync(this.options.configSrc, r)
    });
  }
}


module.exports = ReactConfigRouterWebpackPlugin;
