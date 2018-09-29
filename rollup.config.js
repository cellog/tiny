// rollup.config.js
import resolve from "rollup-plugin-node-resolve"
import babel from "rollup-plugin-babel"

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/index.js",
      format: "cjs"
    },
    {
      file: "es/index.js",
      format: "esm"
    }
  ],
  plugins: [
    resolve({
      // pass custom options to the resolve plugin
      customResolveOptions: {
        moduleDirectory: "node_modules"
      }
    }),
    babel({
      exclude: "node_modules/**" // only transpile our source code
    })
  ],
  external: ["react", "react-dom"]
}
