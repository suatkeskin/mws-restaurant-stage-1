/* eslint-env node */
module.exports = {
	'env': {
		'browser': true,
		'es6': true
	},
	'extends': 'eslint:recommended',
	'parserOptions': {
		'sourceType': 'module',
		'ecmaVersion': 6
	},
	'rules': {
		'indent': [
			'error',
			'tab'
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		'quotes': [
			'error',
			'single'
		],
		'semi': [
			'error',
			'always'
		]
	}
};