/* pug模版引擎 browserify打包
 * @author: qiqin, coderqiqin@aliyun.com
 * @date: 2018-12-06更新
 * 'gulp': 开启任务
 * 'gulp build': 打包压缩文件
 * main 打包js
 */
var gulp = require('gulp'),
		rename = require('gulp-rename'),
		connect = require('gulp-connect'),
		sass = require('gulp-sass'),
		autoprefixer = require('gulp-autoprefixer'),
		watch = require('gulp-watch'),
		changed = require('gulp-changed'),
		debug = require('gulp-debug');

// 压缩
var cleanCSS = require('gulp-clean-css'),
		uglify = require('gulp-uglify')
		tinypng_nokey = require('gulp-tinypng-nokey'),
		zip = require('gulp-zip');

// gulp报错-不退出任务
var plumber = require('gulp-plumber'),
		notify = require('gulp-notify');

// 删除
var del = require('del');

/**************************************************/
// 开启浏览器热刷新
gulp.task('server', function () {
  connect.server({
    root: 'dist',
    port: 8080,
    livereload: true
  }, function() {
    console.log('server已经成功启动, 可以愉快地撸代码了');
  });
});

// browserify 打包
var browserify = require('browserify'),
    watchify = require('watchify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    gutil = require('gulp-util');
    sourcemaps = require("gulp-sourcemaps"),
    assign = require('lodash.assign');
var customOpts = {
  entries: ['./src/js/entry.js'],
  debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts))

gulp.task('browserify', bundle)
// b.on('update', bundle);
// b.on('log', gutil.log);

function bundle() {
  return b.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    // .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/js'));
}
// browserify--end

// pug模版编译
var pug = require('gulp-pug')
gulp.task('pug', function () {
  return gulp.src('src/*.pug')
    .pipe(changed('dist', {extension: '.html'}))
    .pipe(plumber({
      errorHandler: notify.onError({
        title: 'Error',
        message: '<%= error.message %>'})
    }))
    .pipe(pug({
      pretty: true
    }))
    .pipe(gulp.dest('dist'));
})

// sass&scss编译
gulp.task('sass', function () {
  return gulp.src('src/css/**/*.+(scss|sass)')
    .pipe(plumber({
      errorHandler: notify.onError({
        title: 'Error',
        message: '<%= error.message %>'})
    }))
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer()) //自动补全厂商前缀
    .pipe(gulp.dest('src/css'))
    .pipe(cleanCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('src/css'))
    .pipe(gulp.dest('dist/css'));
});

// 拷贝css
gulp.task('copy-css', function () {
  return gulp.src(['src/css/*.css', '!src/css/style.css', '!src/css/style.min.css'])
    .pipe(watch('src/css/*.css'))
    .pipe(gulp.dest('dist/css'));
});

// 图片压缩复制
gulp.task("copy-img", function () {
  return gulp.src('src/img/*.{jpg,png,gif,ico}')
    .pipe(plumber({
      errorHandler: notify.onError({
        title: 'Error',
        message: '<%= error.message %>'})
    }))
    .pipe(tinypng_nokey())
    .pipe(gulp.dest('dist/img'));
});

// 拷贝js
gulp.task('copy-js', function () {
  return gulp.src('src/js/**/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'));
});

// 重载页面
gulp.task('reload', function () {
  return gulp.src('dist/**/*.*')
    .pipe(connect.reload());
})

// 组合watch任务
gulp.task('watch', function () {
  gulp.watch('src/css/*.+(scss|sass)', ['sass']);
  gulp.watch(['src/css/*.css', '!src/css/style.css', '!src/css/style.min.css'], ['copy-css']);
  gulp.watch('src/*.pug', ['pug']);
  gulp.watch(['src/js/*.js', '!src/js/main.js'], ['browserify']);
  gulp.watch('dist/**/*.*', ['reload']);
});

// gulp默认任务
gulp.task('default', ['server', 'watch']);

// 打包压缩文件并压缩图片
gulp.task('build', ['copy-img'], function () {
  var project = process.cwd().split('\\')
  return gulp.src('dist/**/*')
    .pipe(zip(project[project.length-1] + '.zip'))
    .pipe(gulp.dest('./'))
});

// 执行删除dist文件夹
gulp.task('del', function () {
  return gulp.src('dist/*')
    .pipe(del());
});

