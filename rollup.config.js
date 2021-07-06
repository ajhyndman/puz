import typescript from '@rollup/plugin-typescript';

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
    plugins: [typescript()],
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
];
