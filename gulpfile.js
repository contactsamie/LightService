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
//  new Date(),
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
    var scripts1 = gulp.src(['./src/*.js']).pipe(uglify()).pipe(rename({ suffix: '.min' })).pipe(header(banner, { pkg: pkg })).pipe(gulp.dest('./dist'));
    var scripts2 = gulp.src(['./src/*.js']).pipe(header(banner, { pkg: pkg })).pipe(gulp.dest('./dist'));

    //var cdn1 = gulp.src(['./src/*.js']).pipe(uglify()).pipe(rename({ suffix: '.min' })).pipe(header(banner, { pkg: pkg })).pipe(gulp.dest('./cdn/lightservice/' + pkg.version));
    //var cdn2 = gulp.src(['./src/*.js']).pipe(header(banner, { pkg: pkg })).pipe(gulp.dest('./cdn/lightservice/' + pkg.version));

    var cdn3 = gulp.src(['./src/*.js']).pipe(uglify()).pipe(rename({ suffix: '.min' })).pipe(header(banner, { pkg: pkg })).pipe(gulp.dest('./cdn/cdnjs/ajax/libs/lightservice/' + pkg.version));
    var cdn4 = gulp.src(['./src/*.js']).pipe(header(banner, { pkg: pkg })).pipe(gulp.dest('./cdn/cdnjs/ajax/libs/lightservice/' + pkg.version));

    return es.concat.apply(null, [scripts1, scripts2,/* cdn2,cdn1,*/ cdn3, cdn4]);
});

gulp.task('post-build-visual-component', ["build"], function () {
    var scripts1 = gulp.src(['lib/js/cytoscape-dagre.js', 'lib/js/dagre.min.js', 'lib/js/cytoscape.min.js', './dist/visual.lightservice.min.js']).pipe(concat("visual.lightservice.min.js")).pipe(gulp.dest('./dist'));
    var scripts2 = gulp.src(['lib/js/cytoscape-dagre.js', 'lib/js/dagre.min.js', 'lib/js/cytoscape.min.js', './dist/visual.lightservice.js']).pipe(concat("visual.lightservice.js")).pipe(gulp.dest('./dist'));

    var cdn1 = gulp.src(['lib/js/cytoscape-dagre.js', 'lib/js/dagre.min.js', 'lib/js/cytoscape.min.js', './dist/visual.lightservice.min.js']).pipe(concat("visual.lightservice.min.js")).pipe(gulp.dest('./cdn/cdnjs/ajax/libs/lightservice/' + pkg.version));
    var cdn2 = gulp.src(['lib/js/cytoscape-dagre.js', 'lib/js/dagre.min.js', 'lib/js/cytoscape.min.js', './dist/visual.lightservice.js']).pipe(concat("visual.lightservice.js")).pipe(gulp.dest('./cdn/cdnjs/ajax/libs/lightservice/' + pkg.version));

    return es.concat.apply(null, [scripts1, cdn1, scripts2, cdn2]);
});

gulp.task('default', ['post-build-visual-component'], function () {
    gulp.src(['src/lightservice-timemachine.js', 'dist/lightservice-timemachine.min.js']).pipe(header(banner, { pkg: pkg })).pipe(gulp.dest('./dist-lightservice-timemachine/'));
});