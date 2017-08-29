import ascii from "rollup-plugin-ascii";
import node from "rollup-plugin-node-resolve";
import babel from 'rollup-plugin-babel';
import builtins from 'rollup-plugin-node-builtins';

export default {
  entry: "index",
  extend: true,
  format: "umd",
  moduleName: "canvas-highlighter",
  plugins: [node(), ascii(), babel({ exclude: 'node_modules/**' }), builtins() ]
};
