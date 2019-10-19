import { ZarrMetadataType, UserAttributes } from './types';
import { ValidStoreType } from './storage/types';

export function parseMetadata<Z extends ZarrMetadataType | UserAttributes>(s: ValidStoreType | ZarrMetadataType): Z {

    // Here we allow that a store may return an already-parsed metadata object,
    // or a string of JSON that we will parse here. We allow for an already-parsed
    // object to accommodate a consolidated metadata store, where all the metadata for
    // all groups and arrays will already have been parsed from JSON.

    if (typeof s !== 'string') {
        // Assuming it's already parsed
        return s as Z;
    }

    return JSON.parse(s);
}
