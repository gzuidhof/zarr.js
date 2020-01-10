import { ZarrMetadataType, UserAttributes } from './types'
import { ValidStoreType } from './storage/types'

export function parseMetadata(
  s: ValidStoreType | ZarrMetadataType
): ZarrMetadataType | UserAttributes {
  // Here we allow that a store may return an already-parsed metadata object,
  // or a string of JSON that we will parse here. We allow for an already-parsed
  // object to accommodate a consolidated metadata store, where all the metadata for
  // all groups and arrays will already have been parsed from JSON.
  if (typeof s !== 'string') {
    // tslint:disable-next-line: strict-type-predicates
    if (typeof window === 'undefined' && Buffer.isBuffer(s)) {
      return JSON.parse(s.toString())
    } else if (s instanceof ArrayBuffer) {
      // Note, could use a TextDecoder here if we drop support for Edge (much faster)
      return JSON.parse(String.fromCharCode.apply(null, new Uint8Array(s) as any))
    } else {
      return s
    }
  }
  return JSON.parse(s)
}
