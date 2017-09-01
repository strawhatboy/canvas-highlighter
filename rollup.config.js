import ascii from "rollup-plugin-ascii";
import node from "rollup-plugin-node-resolve";
import babel from 'rollup-plugin-babel';
import builtins from 'rollup-plugin-node-builtins';

export default {
  input: "index",
  extend: true,
  output: {
    format: "umd" 
  },
  sourcemap: 'inline',
  name: "canvas-highlighter",
  plugins: [node(), ascii(), babel({ exclude: 'node_modules/**' }), builtins() ]
};
