import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { terser } from 'rollup-plugin-terser';

// do not bundle external dependencies
const external = ['ts-invariant'];
const name = 'Puz';

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'cjs',
    },
    external,
    plugins: [
      typescript({
        declaration: true,
        declarationDir: 'dist/.d.ts',
        declarationMap: true,
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
    },
    external,
    plugins: [typescript()],
  },
  {
    input: 'src/index.ts',
    output: {
      compact: true,
      file: 'dist/index.min.js',
      format: 'umd',
      name,
    },
    external: [],
    plugins: [
      typescript(),
      nodePolyfills({ include: null }),
      nodeResolve({ preferBuiltins: false }),
      terser(),
    ],
  },
  {
    input: './dist/.d.ts/src/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
];
