
export type ArraySelection = (Slice | number | number[] | "..." | ":" | null)[];
export type DimensionSelection = Slice | number | null;
export type SliceArgument = number | ":" | null;

export interface Slice {
    start: number | null;
    stop: number | null;
    step: number | null;

    // Flag to indicate this is in fact a slice
    _slice: true;
}

/**
 * A mapping from chunk to output array for a single dimension.
 */
export interface ChunkDimProjection {
    /**
     * Index of chunk.
     */
    dimChunkIndex: number;
    /**
     * Selection of items from chunk array.
     */
    dimChunkSelection: DimensionSelection;
    /**
     * Selection of items in target (output) array.
     */
    dimOutSelection: DimensionSelection;
}

/**
 * A mapping of items from chunk to output array. Can be used to extract items from the
 * chunk array for loading into an output array. Can also be used to extract items from a
 * value array for setting/updating in a chunk array.
 */
export interface ChunkProjection {
    /**
     * Indices of chunk.
     */
    chunkCoords: number[];
    /**
     * Selection of items from chunk array.
     */
    chunkSelection: number[];
    /**
     * Selection of items in target (output) array.
     */
    outSelection: number[];
}

export interface Indexer {
    numItems: number;
}