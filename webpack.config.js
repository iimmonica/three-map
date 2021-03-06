const webpack = require('webpack');
const WebpackDevServer = require("webpack-dev-server");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = {
    mode: 'none',
    entry: {
        app: ["./src/main.js"],
        'three-map': './src/main.js',
        'three-map.min': './src/main.js',
    },
    output: {
        filename: '[name].js',
        publicPath: '/dist/',
        libraryExport: 'default',
        library: 'ThreeMap',
        libraryTarget: 'umd',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                require('postcss-import'),
                                require('autoprefixer'),
                            ],
                        },
                    },
                    'less-loader',
                ],
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new UglifyJSPlugin({
                include: /\.min\.js$/,
                cache: true,
                parallel: true,
                sourceMap: true,
                uglifyOptions: {
                    compress: {
                        warnings: false,
                        comparisons: false,
                        drop_console: true,
                    },
                    mangle: {
                        safari10: true,
                    },
                    output: {
                        comments: false,
                        ascii_only: true,
                    },
                },
            }),
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
        new OptimizeCSSAssetsPlugin({
            assetNameRegExp: /\.min\.css$/,
        }),
        new webpack.BannerPlugin(
            'three-map\n@version 1.0.0\n@see https://github.com/iimmonica/three-map'
        ),
        new webpack.HotModuleReplacementPlugin(),
    ],
    devServer: {
        contentBase: 'sist/',
        inline: true,
        hot: true
    }
};
