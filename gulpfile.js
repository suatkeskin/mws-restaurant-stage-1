/*eslint-env node */
const gulp = require('gulp');
const gulpSass = require('gulp-sass');
const gulpAutoPreFixer = require('gulp-autoprefixer');
const gulpUglify = require('gulp-uglify');
const gulpRename = require('gulp-rename');
const gulpConcat = require('gulp-concat');
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
		source: 'public/**/!(material.*.min).css',
	},
	styles: {
		source: 'src/sass/**/*.scss',
		concatSource: ['public/css/fonts.material.icons.min.css', 'public/css/material.index.min.css'],
		destination: 'public/css/'
	},
	scripts: {
		source: 'src/js/**/!(material.*).js',
		concatSource: ['public/js/swhelper.min.js', 'public/js/common.min.js'],
		concatIndexSource: ['public/js/idb.min.js', 'public/js/material.index.min.js', 'public/js/dbhelper.min.js', 'public/js/index.min.js'],
		concatRestaurantSource: ['public/js/idb.min.js', 'public/js/material.restaurant.min.js', 'public/js/dbhelper.min.js', 'public/js/restaurant.min.js'],
		destination: 'public/js/'
	},
	materialIndex: {
		source: 'src/js/material.index.js',
		destination: 'public/js/'
	},
	materialRestaurant: {
		source: 'src/js/material.restaurant.js',
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

function materialRestaurant() {
	return browserify({entries: paths.materialRestaurant.source})
		.transform(babelify, {presets: ['env'], global: true, ignore: /\/node_modules\/(?!@material\/)/})
		.bundle()
		.pipe(vinylSourceStream('material.restaurant.min.js'))
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

function concatCommonScripts() {
	return gulp.src(paths.scripts.concatSource)
		.pipe(gulpConcat('app.min.js'))
		.pipe(gulp.dest(paths.scripts.destination));
}

function concatIndexScripts() {
	return gulp.src(paths.scripts.concatIndexSource)
		.pipe(gulpConcat('app.index.min.js'))
		.pipe(gulp.dest(paths.scripts.destination));
}

function concatRestaurantScripts() {
	return gulp.src(paths.scripts.concatRestaurantSource)
		.pipe(gulpConcat('app.restaurant.min.js'))
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

const build = gulp.series(clean, gulp.parallel(materialIndex, materialRestaurant, styles, scripts, images, concatCommonScripts, concatIndexScripts, concatRestaurantScripts));

gulp.task('default', build);
gulp.task('watch', watch);