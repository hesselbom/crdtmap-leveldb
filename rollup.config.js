export default [
  {
    input: 'src/index.js',
    external: id => /^(lib0|crdtmap|level)/.test(id),
    output: {
      name: 'CrdtMapLevelDB',
      file: 'dist/crdtmap-leveldb.cjs',
      format: 'cjs',
      sourcemap: true
    }
  }
]
