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
  },

  // Add .js to work with react-native
  {
    input: 'src/index.js',
    external: id => /^(lib0|crdtmap|level)/.test(id),
    output: {
      name: 'CrdtMapLevelDB',
      file: 'dist/crdtmap-leveldb.cjs.js',
      format: 'cjs',
      sourcemap: true
    }
  }
]
