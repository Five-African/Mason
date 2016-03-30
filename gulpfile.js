var gulp   = require('gulp');
var concat = require('gulp-concat');
var del    = require('del');

gulp.task('clean', function() {
  return del(['dist/**/*']);
});

gulp.task('concat', function() {
  return gulp.src('src/*.js')
    .pipe(concat('Mason.js'))
    .pipe(gulp.dest('dist/'));
});

gulp.task('default', ['clean', 'concat']);
