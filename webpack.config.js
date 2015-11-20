var path = require('path');
var webpack = require('webpack');
var DedupePlugin = webpack.optimize.DedupePlugin;
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

var isDev = process.env.COINS_ENV === 'development';

module.exports = {
    node: {
        fs: "empty"
    },
    entry: {
        'coins-logon-widget': './scripts/coins-logon-widget.js'
    },
    output: {
        path: path.join(__dirname + '/dist'),
        filename: '[name].js', // one for each `entry`
        library: 'CoinsLogonWidget',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    plugins: [
        new DedupePlugin()
    ].concat(isDev ? [
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: false,
            compress: {
                warnings: false
            }
        })
    ] : [])
};
