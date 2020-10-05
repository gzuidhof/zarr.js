import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: {
      zarr: 'src/zarr.ts',
      core: 'src/zarr-core.ts',
    },
    output: {
      dir: 'dist/',
      format: 'es',
      entryFileNames: '[name].mjs',
      sourcemap: true,
    },
    watch: {
      include: 'src/**',
    },
    plugins: [
      typescript({ useTsconfigDeclarationDir: true }),
      commonjs(),
      resolve(),
    ],
  },
  {
    input: 'src/zarr.ts',
    output: { file: 'dist/zarr.cjs', format: 'cjs', sourcemap: true },
    plugins: [
      typescript({ useTsconfigDeclarationDir: true }),
      commonjs(),
      resolve(),
    ],
  },
  {
    input: 'src/zarr.ts',
    output: {
      file: 'dist/zarr.umd.js',
      name: 'zarr',
      format: 'umd',
      sourcemap: true,
      esModule: false,
    },
    plugins: [
      typescript({
        useTsconfigDeclarationDir: true,
        // https://github.com/ezolenko/rollup-plugin-typescript2/issues/105
        objectHashIgnoreUnknownHack: true,
      }),
      commonjs(),
      resolve(),
      terser(),
    ],
  }
];
