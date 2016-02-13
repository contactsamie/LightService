var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var es = require('event-stream');
var webserver = require('gulp-webserver');
var debug = require('gulp-debug');
var minifyHTML = require('gulp-minify-html');
var templateCache = require('gulp-angular-templatecache');
var uglifycss = require('gulp-uglifycss');
var ngmin = require('gulp-ngmin');
var useref = require('gulp-useref');
var gulpif = require('gulp-if');
var bower = require('gulp-bower');
var header = require('gulp-header');
var pkg = require('./package.json');
var fs = require('fs');
var clean = require('gulp-clean');
var rename = require('gulp-rename');

var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  new Date(),
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' * @license <%= pkg.author %>',
  ' */',
  ''].join('\n');

gulp.task('clean', function () {
    var cleanScript = gulp.src('./dist', { read: false }).pipe(clean());
    return es.concat.apply(null, [cleanScript]);
});

gulp.task('build',["clean"], function () {
    var scripts = gulp.src(['./src/*.js']).pipe(uglify()).pipe(rename({suffix: '.min'})).pipe(header(banner, { pkg: pkg })).pipe(gulp.dest('./dist/src'));
    return es.concat.apply(null, [scripts]);
});

gulp.task('default', ['build'], function () { });