var gulp   = require('gulp');
var concat = require('gulp-concat');
var del    = require('del');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var header = require('gulp-header');

var license = ['/**',
  ' * Mason',
  ' * https://github.com/Five-African/Mason',
  ' * ',
  ' * Copyright 2016 Five-African',
  ' * Released under the Apache License 2.0',
  ' */',
  ''].join('\n');

gulp.task('clean', function() {
  return del(['dist/**/*']);
});

gulp.task('concat', function() {
  return gulp.src('src/*.js')
    .pipe(concat('Mason.js'))
    .pipe(header(license))
    .pipe(gulp.dest('dist/'));
});

gulp.task('uglify', function() {
  return gulp.src('dist/Mason.js')
    .pipe(uglify({}))
    .pipe(header(license))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('default', ['clean', 'concat', 'uglify']);
