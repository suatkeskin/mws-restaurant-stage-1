/*eslint-env node */

const gulp = require('gulp');
const gulpSass = require('gulp-sass');
const gulpAutoPrefixer = require('gulp-autoprefixer');
// const gulpEslint = require('gulp-eslint');
const gulpUglify = require('gulp-uglify');
const gulpRename = require('gulp-rename');
const gulpClean = require('gulp-clean');
const gulpImagemin = require('gulp-imagemin');
const gulpBabel = require('gulp-babel');

let paths = {
	assets: {
		source: 'public/*',
	},
	styles: {
		source: 'src/sass/**/*.scss',
		destination: 'public/css/'
	},
	scripts: {
		source: 'src/js/**/*.js',
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

function styles() {
	return gulp.src(paths.styles.source)
		.pipe(gulpSass({outputStyle: 'compressed'}).on('error', gulpSass.logError))
		.pipe(gulpAutoPrefixer({browsers: ['last 2 versions']}))
		.pipe(gulpRename({suffix: '.min'}))
		.pipe(gulp.dest(paths.styles.destination));
}

function scripts() {
	return gulp.src(paths.scripts.source, {sourcemaps: true})
		.pipe(gulpBabel({presets: ['es2015']}))
		.pipe(gulpUglify())
		.pipe(gulpRename({suffix: '.min'}))
		.pipe(gulp.dest(paths.scripts.destination));
}

function images() {
	return gulp.src(paths.images.source)
		.pipe(gulpImagemin())
		.pipe(gulp.dest(paths.images.destination));
}

// function lint() {
// 	return gulp.src(paths.scripts.source)
// 		.pipe(gulpEslint())
// 		.pipe(gulpEslint.format())
// 		.pipe(gulpEslint.failOnError());
// }

function watch(done) {
	gulp.watch(paths.scripts.src, scripts);
	gulp.watch(paths.styles.src, styles);
	done();
}

const build = gulp.series(clean, gulp.parallel(styles, scripts, images));

gulp.task('default', build);
gulp.task('watch', watch);