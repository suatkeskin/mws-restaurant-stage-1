/*eslint-env node */
const gulp = require('gulp');
const gulpSass = require('gulp-sass');
const gulpAutoPreFixer = require('gulp-autoprefixer');
const gulpUglify = require('gulp-uglify');
const gulpRename = require('gulp-rename');
const gulpClean = require('gulp-clean');
const gulpImageMin = require('gulp-imagemin');
const gulpBabel = require('gulp-babel');
const gulpStreamify = require('gulp-streamify');
const babelify = require('babelify');
const imageMinPngquant = require('imagemin-pngquant');
const browserify = require('browserify');
const vinylSourceStream = require('vinyl-source-stream');

let paths = {
	assets: {
		source: 'public/**/!(material.index.min).css',
	},
	styles: {
		source: 'src/sass/**/*.scss',
		destination: 'public/css/'
	},
	scripts: {
		source: 'src/js/**/!(material.*).js',
		destination: 'public/js/'
	},
	materialIndex: {
		source: 'src/js/material.index.js',
		destination: 'public/js/'
	},
	images: {
		source: 'src/img/**/*',
		destination: 'public/img/'
	}
};

function clean() {
	return gulp.src(paths.assets.source, {read: false, force: true}).pipe(gulpClean());
}

function materialIndex() {
	return browserify({entries: paths.materialIndex.source})
		.transform(babelify, {presets: ['env'], global: true, ignore: /\/node_modules\/(?!@material\/)/})
		.bundle()
		.pipe(vinylSourceStream('material.index.min.js'))
		.pipe(gulpStreamify(gulpBabel({presets: ['env']})))
		.pipe(gulpStreamify(gulpUglify()))
		.pipe(gulp.dest(paths.materialIndex.destination));
}

function styles() {
	return gulp.src(paths.styles.source)
		.pipe(gulpSass({includePaths: './node_modules/'}))
		.pipe(gulpSass({outputStyle: 'compressed'}).on('error', gulpSass.logError))
		.pipe(gulpAutoPreFixer({browsers: ['last 2 versions']}))
		.pipe(gulpRename({suffix: '.min'}))
		.pipe(gulp.dest(paths.styles.destination));
}

function scripts() {
	return gulp.src(paths.scripts.source)
		.pipe(gulpBabel({presets: ['env']}))
		.pipe(gulpUglify())
		.pipe(gulpRename({suffix: '.min'}))
		.pipe(gulp.dest(paths.scripts.destination));
}

function images() {
	return gulp.src(paths.images.source)
		.pipe(gulpImageMin({progressive: true, use: [imageMinPngquant()]}))
		.pipe(gulp.dest(paths.images.destination));
}

function watch(done) {
	gulp.watch(paths.scripts.src, scripts);
	gulp.watch(paths.styles.src, styles);
	done();
}

const build = gulp.series(clean, gulp.parallel(materialIndex, styles, scripts, images));

gulp.task('default', build);
gulp.task('watch', watch);