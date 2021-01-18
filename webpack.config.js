"use strict";
module.exports = (env, argv) => {
    let loader;
    if (argv['ftst']) {
        loader = {
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
        }
    } else {
        loader = {
            test: /\.(t|j)sx?$/,
            use: {
                loader: 'ts-loader',
                options: {
                    transpileOnly: true
                }
            },
            exclude: /node_modules/,
        }
    }
    return {
        devtool: 'source-map',
        entry: {
            simple: './demo.ts',
            react: './demo-react.tsx',
        },
        module: {
            rules: [
                loader,
                {
                    test: /\.(png|jpe?g|gif)$/i,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: '[path][name].[ext]',
                            }
                        },
                    ],
                }],
        },
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
        optimization: {
            minimize: false
        },
        devServer: {
            contentBase: __dirname,
            compress: true,
            port: 9000
        },
    }
};
