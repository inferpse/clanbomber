var gulp = require('gulp'),
  plugins = require('gulp-load-plugins')(),
  path = require('path'),
  webpack = require('webpack'),
  webpackDevMiddleware = require('webpack-dev-middleware'),
  express = require('express'),
  tinylr = require('tiny-lr'),
  app = express(),
  port = process.env.PORT || 1234;

// webpack configuration
var webpackConfig = {
  entry: {
    main: [
      'babel-polyfill/dist/polyfill.js',
      path.resolve('js/main.js')
    ]
  },
  output: {
    path: path.join(__dirname, 'js'),
    publicPath: 'js/',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' }
    ],
    postLoaders: [
      { loader: 'transform/cacheable?envify' }
    ],
    noParse: [
      /\/babel-polyfill\/dist\/polyfill\.js$/
    ]
  }
};

// simple webpack plugin to display errors in browser console
function RedirectErrorsToConsole() {
  this.apply = function(compiler) {
    compiler.plugin('done', function(stats) {
      if (stats.hasErrors()) {
        var mainBundle = path.join(compiler.options.output.path, compiler.options.output.filename);
        var errors = stats.toString({
          hash: false,
          version: false,
          timings: false,
          assets: false,
          chunks: false,
          chunkModules: false,
          modules: false,
          cached: false,
          reasons: false,
          source: false,
          errorDetails: true,
          chunkOrigins: false,
          modulesSort: false,
          chunksSort: false,
          assetsSort: false
        }).replace(/\n/g, '\\n').replace(/\[\d+m/g, '').replace(/'/g, '\\\'');
        compiler.outputFileSystem.writeFile(mainBundle, 'throw new Error(\'' + errors + '\')', function() {});
      }
    });
  };
}

// dev server + webpack
gulp.task('webpack:dev', function(callback) {
  // set development env
  webpackConfig.devtool = 'source-map';
  webpackConfig.plugins = (webpackConfig.plugins || []).concat([
    new webpack.DefinePlugin({ 'process.env': {'NODE_ENV': '"development"'} }),
    new RedirectErrorsToConsole()
  ]);

  // initialize webpack
  var webpackCompiler = webpack(webpackConfig);

  // setup livereload
  webpackCompiler.plugin('done', function() {
    if (callback.called) {
      // notify livereload
      tinylr.changed(webpackConfig.output.publicPath + webpackConfig.output.filename);
    } else {
      // fire gulp callback once
      callback.called = true;
      callback();
    }
  });

  // setup dev middleware
  app.use(webpackDevMiddleware(webpackCompiler, {
    publicPath: '/js',
    quiet: true,
    stats: {
      colors: true
    }
  }));
});

gulp.task('webpack:build', function(callback) {
  // compress code
  webpackConfig.plugins = (webpackConfig.plugins || []).concat([
    new webpack.DefinePlugin({ 'process.env': {'NODE_ENV': '"production"'} }),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurenceOrderPlugin()
  ]);

  // build bundle
  webpack(webpackConfig).run(callback);
});

gulp.task('livereload', function() {
  // setup livereload
  var tinylrPort = 50877;
  tinylr().listen(tinylrPort);
  app.use(require('connect-livereload')({port: tinylrPort}));
});

gulp.task('watch', ['livereload'], function() {
  // watch for changes in main html file
  gulp.watch(path.resolve('index.html'), function(e) {
    tinylr.changed(e.path);
  });
});

gulp.task('server', function(callback) {
  // rewrite index.html
  (function(fs, fileName) {
    fs.writeFileSync(fileName, fs.readFileSync(fileName));
  }(require('fs'), 'index.html'));

  // serve static folder
  app.use(express.static(__dirname))
    .listen(port, callback);
});

// open browser when everything ready
gulp.task('open-browser', ['server'], function() {
  gulp.src(path.resolve('index.html')).pipe(plugins.open('', {
    url: 'http://localhost:' + port
  }));
});

// specify main tasks
gulp.task('build', ['webpack:build', 'server', 'open-browser']);
gulp.task('default', ['webpack:dev', 'watch', 'livereload', 'server', 'open-browser']);
