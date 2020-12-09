"use strict";
module.exports = (env, argv) => {
    let module;
    if (argv['ftst']) {
        module = {
            rules: [{
                test: /\.(t|j)sx?$/,
                use: {
                    loader: 'ftst-loader',
                    options: {
                        transpileOnly: true,
                        transformNullishCoalesce: true,
                        configFile: 'ftst-config.json'
                    }
                },
                exclude: /node_modules/,
            }],
        }
    } else {
        module = {
            rules: [{
                test: /\.(t|j)sx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true
                    }
                },
                exclude: /node_modules/,
            }],
        }
    }
    return {
        devtool: 'source-map',
        entry: {
            simple: './demo.ts',
            react: './demo-react.tsx',
        },
        module: module,
        resolveLoader: {
            modules: [
                "node_modules",
                __dirname + "/node_modules",
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        output: {
            filename: 'bundle.[name].js',
            path: __dirname + '/dist',
        },
        devServer: {
            contentBase: __dirname,
            compress: true,
            port: 9000
        },
    }
};