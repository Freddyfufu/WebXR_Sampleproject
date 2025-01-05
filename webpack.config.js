const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.js',
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        host: '0.0.0.0',
        server: 'https',
        compress: true,
        port: 8081,
        client: {
            overlay: { warnings: false, errors: true },
        },
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    plugins: [
        new ESLintPlugin({
            extensions: ['js'],
            eslintPath: require.resolve('eslint'),
            overrideConfigFile: path.resolve(__dirname, './eslint.config.cjs'),
        }),
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        // new CopyPlugin({
        //     patterns: [
        //         {
        //             from: path.resolve(__dirname, 'src/assets/three-mesh-ui/assets'),
        //             to: 'assets',
        //         },
        //     ],
        // }),
    ],
    module: {
        rules: [
            {
                test: /\.json$/,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/[name][ext]',
                },
            },
            {
                test: /\.(png|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/images/[name][ext]',
                },
            },
        ],
    },
    devtool: 'source-map',
};
