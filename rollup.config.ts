import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';

const commonPlugins = () => [typescript({ useTsconfigDeclarationDir: true }), commonjs(), resolve()];


export default [
  {
    input: { zarr: 'src/zarr.ts', core: 'src/zarr-core.ts' },
    output: [{
      dir: 'dist/',
      format: 'es',
      entryFileNames: '[name].mjs',
      sourcemap: true,
    },
    {
      dir: 'dist/',
      format: 'es',
      entryFileNames: '[name].min.mjs',
      sourcemap: true,
      plugins: [terser()]
    },
    ],
    watch: {
      include: 'src/**',
    },
    plugins: [...commonPlugins(), visualizer({ filename: "stats.html" }), visualizer({ filename: "stats.min.html", sourcemap: true })],
  },
  {
    input: 'src/zarr.ts',
    output: [
      { file: 'dist/zarr.cjs', format: 'cjs', sourcemap: true },
      {
        file: 'dist/zarr.umd.js',
        name: 'zarr',
        format: 'umd',
        sourcemap: true,
        esModule: false,
        plugins: [terser()],
      },
    ],
    plugins: [
      ...commonPlugins()
    ],
  },
];
