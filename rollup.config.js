import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

// do not bundle external dependencies
const external = ['ts-invariant'];

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
    input: './dist/.d.ts/src/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
];
