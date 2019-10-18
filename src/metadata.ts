import { ZarrMetadataType } from './types';

export function parseMetadata<ZarrMetadataType>(s: string | ZarrMetadataType): ZarrMetadataType {

    // Here we allow that a store may return an already-parsed metadata object,
    // or a string of JSON that we will parse here. We allow for an already-parsed
    // object to accommodate a consolidated metadata store, where all the metadata for
    // all groups and arrays will already have been parsed from JSON.

    if (s["zarr_format"]) {
        // Assuming it's already parsed
        return s as ZarrMetadataType;
    }

    return JSON.parse(s as string);
}
