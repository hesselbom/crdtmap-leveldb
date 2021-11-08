const CrdtMap = require('crdtmap')
const levelMem = require('level-mem') // eslint-disable-line
const { createLevelDBHandler } = require('../dist/crdtmap-leveldb.cjs')

const doc = CrdtMap()
// const handler = createLevelDBHandler('./db', doc, levelMem)
const handler = createLevelDBHandler('./db', doc)

// doc.set('key1', 'before-sync')
console.log('before sync', doc.toJSON())

handler.whenSynced.then(() => {
  // doc.set('key2', 'after-sync')
  console.log('after sync', doc.toJSON())
})
