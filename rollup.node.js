var fs = require("fs"),
    rollup = require("rollup"),
    babel = require('rollup-plugin-babel'),
    builtins = require('rollup-plugin-node-builtins'),
    dependencies = require("./package.json").dependencies;

rollup.rollup({
    input: "index.js",
    sourcemap: 'inline',
    external: dependencies ? Object.keys(dependencies) : undefined,
    plugins: [
        babel({ exclude: 'node_modules/**' }), builtins()
    ]
}).then(function (bundle) {
    return bundle.generate({ format: "cjs" });
}).then(function (result) {
    var code = result.code //+ "Object.defineProperty(exports, \"event\", {get: function() { return d3Selection.event; }});\n";
    return new Promise(function (resolve, reject) {
        fs.writeFile("build/canvas-highlighter.node.js", code, "utf8", function (error) {
            if (error) return reject(error);
            else resolve();
        });
    });
}).catch(abort);

function abort(error) {
    console.error(error.stack);
}
