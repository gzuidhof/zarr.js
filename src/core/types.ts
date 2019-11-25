
export type ArraySelection = DimensionArraySelection[] | number | null;
export type DimensionArraySelection = Slice | number | number[] | "..." | ":" | null;

export type NormalizedArraySelection = (Slice | number)[];

export type DimensionSelection = Slice | number | null;
export type SliceArgument = number | ":" | null;

export type SliceIndices = [number, number, number, number];

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
    chunkSelection: DimensionSelection[];
    /**
     * Selection of items in target (output) array.
     */
    outSelection: DimensionSelection[];
}

export interface Indexer {
    shape: number[];
    dropAxes: null;
    iter: () => IterableIterator<ChunkProjection>;
}

export interface DimIndexer {
    numItems: number;
    iter: () => IterableIterator<ChunkDimProjection>;
}