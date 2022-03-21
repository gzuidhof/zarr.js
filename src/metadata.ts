import { ZarrMetadataType, UserAttributes } from './types';
import { ValidStoreType } from './storage/types';
import { isArrayBufferLike, IS_NODE } from './util';

export function parseMetadata(
    s: ValidStoreType | ZarrMetadataType
): ZarrMetadataType | UserAttributes {
    // Here we allow that a store may return an already-parsed metadata object,
    // or a string of JSON that we will parse here. We allow for an already-parsed
    // object to accommodate a consolidated metadata store, where all the metadata for
    // all groups and arrays will already have been parsed from JSON.
    if (typeof s !== 'string') {
        // tslint:disable-next-line: strict-type-predicates
        if (IS_NODE && Buffer.isBuffer(s)) {
            return JSON.parse(s.toString());
        } else if (isArrayBufferLike(s)) {
            const utf8Decoder = new TextDecoder();
            const bytes = new Uint8Array(s);
            return JSON.parse(utf8Decoder.decode(bytes));
        } else {
            return s;
        }
    }
    return JSON.parse(s);
}
