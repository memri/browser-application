"use strict";
module.exports = {
    devtool: 'source-map',
    entry: {
        simple: './demo.ts',
        react: './demo-react.tsx',
    },
    module: {
        rules: [{
            test: /\.(t|j)sx?$/,
            use: {
                loader: 'ftst-loader',
                options: {
                    transpileOnly: true,
                    transformNullishCoalesce: true
                }
            },
            exclude: /node_modules/,
        }],
    },
    resolveLoader: {
        modules: [
            "node_modules", 
            __dirname + "/node_modules",
        ],
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
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
};