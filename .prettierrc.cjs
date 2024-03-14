/** @type {import('prettier').Config} */
module.exports = {
  bracketSpacing: true,
  bracketSameLine: true,
  singleQuote: true,
  trailingComma: 'es5',
  semi: true,
  printWidth: 120,
  arrowParens: 'always',
  importOrderSeparation: true,
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
};
