const path = require('path');
// const BowerWebpackPlugin = require('bower-webpack-plugin');

module.exports = {
	entry: './demos/src/demo.js',
	output: {
		path: path.join(__dirname, '.tmp/scripts'),
		filename: 'demo.js',
		sourceMapFilename: '[file].map'
	},
	watch: true,
	devtool: 'source-map',
	module: {
		loaders: [
			{
				test: /\.js$/,
				include: [
					path.resolve(__dirname, 'main.js'),
					path.resolve(__dirname, 'src/js'),
					path.resolve(__dirname, 'demos/src')
				],
				loader: 'babel',
				query: {
					presets: ['es2015']
				}
			}
		]
	}/*,
	plugins: [
		new BowerWebpackPlugin({
			includes: /\.js$/
		})
	]*/
};
