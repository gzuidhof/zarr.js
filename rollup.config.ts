import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';

const pkg = require('./package.json');

const libraryName = 'zarr';

const config = ({ input, output }) => {
  return {
    input,
    output,
    watch: {
      include: 'src/**',
    },
    plugins: [
      // Allow json resolution
      json(),
      // Compile TypeScript files
      typescript({ useTsconfigDeclarationDir: true }),
      // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
      commonjs(),
      // Allow node_modules resolution, so you can use 'external' to control
      // which external modules to include in the bundle
      // https://github.com/rollup/rollup-plugin-node-resolve#usage
      resolve(),
      // Resolve source maps to the original source
      sourceMaps(),
    ],
  }
}

export default [
  config({
    input: `src/${libraryName}.ts`,
    output: [
      { file: pkg.main, name: libraryName, format: 'umd', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true },
    ],
  }),
  config({
    input: "src/zarr-core.ts",
    output: {
      file: pkg.exports['./core'], format: 'es', sourcemap: true
    }
  })
];
