const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');

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
        server: {
            type: 'https', // Aktuelles Schema für HTTPS
            options: {
                key: fs.readFileSync('./certs/localhost-key.pem'),
                cert: fs.readFileSync('./certs/localhost.pem'),
            },
        },
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
        // Copy assets to the output directory
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'assets'), // Kopiere Dateien aus dem Verzeichnis 'assets'
                    to: 'assets', // Zielverzeichnis
                },
            ],
        }),
    ],
    module: {
        rules: [
            // JSON-Dateien
            {
                test: /\.json$/,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/[name][ext]',
                },
            },
            // Bilder
            {
                test: /\.(png|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/images/[name][ext]',
                },
            },
            // GLTF/GLB-Dateien
            {
                test: /\.(gltf|glb)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/models/[name][ext]',
                },
            },
        ],
    },
    devtool: 'source-map',
};
