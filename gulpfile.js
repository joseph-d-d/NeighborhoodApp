/**
 * Created by Joseph on 11/5/2016.
 */
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var minHTML = require('gulp-htmlmin');
var cleanCSS = require('gulp-clean-css');


gulp.task('js', function () {
    return gulp.src('src/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(stripDebug())
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('html', function () {
    return gulp.src('src/*.html')
        .pipe(minHTML({collapseWhitespace: true}))
        .pipe(gulp.dest('dist/'));
});

gulp.task('css', function () {
    return gulp.src('src/css/*')
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/css/'));
});

gulp.task('default', ['js', 'html', 'css']);