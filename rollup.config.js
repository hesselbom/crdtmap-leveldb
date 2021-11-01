export default [
  {
    input: 'src/index.js',
    external: id => /^(lib0|vjs|level)/.test(id),
    output: {
      name: 'VLevelDB',
      file: 'dist/v-leveldb.cjs',
      format: 'cjs',
      sourcemap: true
    }
  }
]
