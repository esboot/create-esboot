import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    strict: false,
  },
  plugins: [
    resolve(),json(), typescript(), commonjs(),
  ],
  external: [
    'child_process',
    'fs',
    'path',
    'os',
    'readline',
    'buffer',
    'stream',
    'https',
    'zlib',
    'util',
    'url',
    'tty',
    'http',
    'net',
    'tls',
    'crypto',
    'assert',
    'constants',
    'try-thread-sleep',
    'events',
    'querystring',
    'string_decoder'
  ]
};
