module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: ['eslint:recommended', 'prettier'],
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module',
	},
	rules: {
		'sort-imports': "off",
		'no-unused-vars': "off",
		'no-undef': "off",
		'no-useless-constructor': "off",
		'no-empty-function': "off",
		'no-prototype-builtins': "off",
		'lines-between-class-members': "off",
	},
};
