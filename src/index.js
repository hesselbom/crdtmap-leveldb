import CrdtMap from 'crdtmap'
import defaultLevel from 'level'
import * as encoding from 'lib0/dist/encoding.cjs'
import * as decoding from 'lib0/dist/decoding.cjs'

const valueEncoding = {
  encode: buf => Buffer.from(buf),
  decode: buf => Uint8Array.from(buf)
}

export function createLevelDBHandler (path, doc, level = defaultLevel, levelOptions = {}, levelCallback) {
  let currentTransaction = Promise.resolve()
  let db
  const _db = level(path, { ...levelOptions, valueEncoding }, levelCallback)

  // Execute a transaction on a database. This will ensure that other processes are currently not writing.
  const transact = (f) => {
    currentTransaction = currentTransaction.then(async () => {
      let res = null
      try { res = await f(db) } catch (err) {
        console.warn('Error during crdtmap-leveldb transaction', err)
      }
      return res
    })
    return currentTransaction
  }

  const fetchStored = (db) => new Promise((resolve, reject) => {
    const snapshot = {}

    db.createReadStream()
      .on('data', function (data) {
        const decoder = decoding.createDecoder(data.value)
        const value = decoding.readAny(decoder)

        snapshot[data.key] = value
      })
      .on('error', function (err) {
        console.log('Oh my!', err)
        reject(err)
      })
      .on('end', function () {
        doc.applySnapshot(snapshot)
        resolve(snapshot)
      })
  })

  const whenSynced = Promise.resolve().then(() => {
    const currentSnapshot = doc.getSnapshotFromTimestamp(0)

    return transact(() => fetchStored(_db))
      .then(storedSnapshot => {
        // Wait until here to set db to avoid onUpdate called when fetching stored snapshot
        db = _db

        // And now store snapshot from before indexeddb sync
        // To make sure we only store latest data, we filter snapshot first by getting appliedSnapshot from a dummy doc
        const dummyDoc = CrdtMap()
        dummyDoc.applySnapshot(storedSnapshot)
        dummyDoc.on('snapshot', (_, appliedSnapshot) => {
          // Store applied snapshot, which is the changes we had in the doc prior to loading indexeddb
          storeSnapshot(appliedSnapshot)
        })

        // When we apply this snapshot, "snapshot" will be emitted with applied part of snapshot, ensuring we're storing latest
        dummyDoc.applySnapshot(currentSnapshot)
      })
  })

  const storeSnapshot = (snapshot) => {
    if (db) {
      transact(() => {
        return Promise.all(
          Object.entries(snapshot)
            .map(([key, value]) => {
              const encoder = encoding.createEncoder()
              encoding.writeAny(encoder, value)
              const data = encoding.toUint8Array(encoder)

              return db.put(key, data)
            })
        )
      })
    }
  }

  // Updates are always latest data, so safe to store as snapshot
  const onUpdate = storeSnapshot

  // Snapshot should only stored applied snapshot, to not store accidental old data
  const onSnapshot = (_, appliedSnapshot) => storeSnapshot(appliedSnapshot)

  const handler = {
    doc,
    whenSynced,
    destroy () {
      doc.off('update', onUpdate)
      doc.off('snapshot', onSnapshot)
      doc.off('destroy', this.destroy)

      return transact(() => _db.close())
    }
  }

  doc.on('update', onUpdate)
  doc.on('snapshot', onSnapshot)
  doc.on('destroy', handler.destroy)

  return handler
}
