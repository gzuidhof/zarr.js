import { Store, ValidStoreType } from "../storage/types";

import { pathToPrefix } from '../storage/index';
import { normalizeStoragePath, isTotalSlice } from "../util";
import { ZarrArrayMetadata, UserAttributes } from '../types';
import { ARRAY_META_KEY, ATTRS_META_KEY } from '../names';
import { Attributes } from "../attributes";
import { parseMetadata } from "../metadata";
import { ArraySelection, DimensionSelection, Indexer } from "./types";
import { BasicIndexer, isContiguousSelection } from './indexing';
import { AssertionError } from "assert";
import { NestedArray, dtypeMapping } from "../nestedArray";
import { TypedArray } from "../nestedArray/types";
import { ValueError, PermissionError } from "../errors";

export class ZarrArray {

  public store: Store<ValidStoreType>;

  private _chunkStore: Store<ValidStoreType> | null;
  /**
   * A `Store` providing the underlying storage for array chunks.
   */
  public get chunkStore(): Store<ValidStoreType> {
    if (this._chunkStore) {
      return this._chunkStore;
    }
    return this.store;
  }
  public path: string;
  public keyPrefix: string;
  public readOnly: boolean;
  public cacheMetadata: boolean;
  public cacheAttrs: boolean;
  public meta: ZarrArrayMetadata;
  public attrs: Attributes<UserAttributes>;

  /**
   * Array name following h5py convention.
   */
  public get name(): string | null {
    if (this.path.length > 0) {
      if (this.path[0] !== "/") {
        return "/" + this.path;
      }
      return this.path;
    }
    return null;
  }

  /**
   * Final component of name.
   */
  public get basename(): string | null {
    const name = this.name;
    if (name === null) {
      return null;
    }
    const parts = name.split("/");
    return parts[parts.length - 1];
  }

  /**
   * "A list of integers describing the length of each dimension of the array.
   */
  public get shape(): number[] {
    this.refreshMetadata();
    return this.meta.shape;
  }

  /**
   * A list of integers describing the length of each dimension of a chunk of the array.
   */
  public get chunks(): number[] {
    return this.meta.chunks;
  }

  /**
   * Integer describing how many element a chunk contains
   */
  private get chunkSize(): number {
    return this.chunks.reduce((x, y) => x * y, 1);
  }

  /**
   *  The NumPy data type.
   */
  public get dtype() {
    return this.meta.dtype;
  }

  /**
   *  A value used for uninitialized portions of the array.
   */
  public get fillValue() {
    return this.meta.fill_value;
  }

  /**
   *  Number of dimensions.
   */
  public get nDims() {
    return this.meta.shape.length;
  }

  /**
   *  The total number of elements in the array.
   */
  public get size() {
    this.refreshMetadata();
    return this.meta.shape.reduce((x, y) => x * y, 1);
  }

  public get length() {
    return this.shape[0];
  }


  private get _cdataShape() {
    if (this.shape === []) {
      return [1];
    } else {
      const s = [];
      for (let i = 0; i < this.shape.length; i++) {
        s[i] = Math.ceil(this.shape[i] / this.chunks[i]);
      }
      return s;
    }
  }
  /**
   * A tuple of integers describing the number of chunks along each
   * dimension of the array.
   */
  public get cdataShape() {
    this.refreshMetadata();
    return this._cdataShape;
  }

  /**
   * Total number of chunks.
   */
  public get numChunks() {
    this.refreshMetadata();
    return this.cdataShape.reduce((x, y) => x * y, 1);
  }

  /**
   * Instantiate an array from an initialized store.
   * @param store Array store, already initialized.
   * @param path Storage path.
   * @param readOnly True if array should be protected against modification.
   * @param chunkStore Separate storage for chunks. If not provided, `store` will be used for storage of both chunks and metadata.
   * @param cacheMetadata If true (default), array configuration metadata will be cached for the lifetime of the object.
   * If false, array metadata will be reloaded prior to all data access and modification operations (may incur overhead depending on storage and data access pattern).
   * @param cacheAttrs If true (default), user attributes will be cached for attribute read operations.
   * If false, user attributes are reloaded from the store prior to all attribute read operations.
   */
  constructor(store: Store<ValidStoreType>, path: null | string = null, readOnly: boolean = false, chunkStore: Store<ArrayBuffer | Buffer> | null = null, cacheMetadata = true, cacheAttrs = true) {
    // N.B., expect at this point store is fully initialized with all
    // configuration metadata fully specified and normalized

    this.store = store;
    this._chunkStore = chunkStore;
    this.path = normalizeStoragePath(path);
    this.keyPrefix = pathToPrefix(this.path);
    this.readOnly = readOnly;
    this.cacheMetadata = cacheMetadata;
    this.cacheAttrs = cacheAttrs;
    this.meta = this.loadMetadata();

    const attrKey = this.keyPrefix + ATTRS_META_KEY;
    this.attrs = new Attributes<UserAttributes>(this.store, attrKey, this.readOnly, cacheAttrs);
  }

  /**
   * (Re)load metadata from store
   */
  private loadMetadata() {
    const metaKey = this.keyPrefix + ARRAY_META_KEY;
    const metaStoreValue = this.store.getItem(metaKey);
    this.meta = parseMetadata(metaStoreValue);
    return this.meta;
  }

  private refreshMetadata() {
    if (!this.cacheMetadata) {
      this.loadMetadata();
    }
  }

  public getItem(selection: ArraySelection) {
    return this.getBasicSelection(selection);
  }

  public getBasicSelection(selection: ArraySelection) {
    // Refresh metadata
    if (!this.cacheMetadata) {
      this.loadMetadata();
    }

    // Check fields (TODO?)

    if (this.shape === []) {
      throw new Error("Shape [] indexing is not supported yet");
    } else {
      return this.getBasicSelectionND(selection);
    }
  }

  getBasicSelectionND(selection: ArraySelection) {
    const indexer = new BasicIndexer(selection, this);
    return this.getSelection(indexer);
  }

  private getSelection(indexer: BasicIndexer) {
    // We iterate over all chunks which overlap the selection and thus contain data
    // that needs to be extracted. Each chunk is processed in turn, extracting the
    // necessary data and storing into the correct location in the output array.

    // N.B., it is an important optimisation that we only visit chunks which overlap
    // the selection. This minimises the number of iterations in the main for loop.

    // check fields are sensible (TODO?)

    const outDtype = this.dtype;
    const outShape = indexer.shape;
    const outSize = indexer.shape.reduce((x, y) => x * y, 1);

    const out = new NestedArray(null, outShape, outDtype);

    for (let proj of indexer.iter()) {
      this.chunkGetItem(proj.chunkCoords, proj.chunkSelection, out, proj.outSelection, indexer.dropAxes);
    }

    return out;
  }

  /**
   * Obtain part or whole of a chunk.
   * @param chunkCoords Indices of the chunk.
   * @param chunkSelection Location of region within the chunk to extract.
   * @param out Array to store result in.
   * @param outSelection Location of region within output array to store results in.
   * @param dropAxes Axes to squeeze out of the chunk.
   */
  private chunkGetItem<T extends TypedArray>(chunkCoords: number[], chunkSelection: DimensionSelection[], out: NestedArray<T>, outSelection: DimensionSelection[], dropAxes: null | number[]) {
    if (chunkCoords.length !== this._cdataShape.length) {
      throw new AssertionError({ message: `Inconsistent shapes: chunkCoordsLength: ${chunkCoords.length}, cDataShapeLength: ${this.cdataShape.length}` });
    }

    const cKey = this.chunkKey(chunkCoords);

    // TODO may be better to ask for forgiveness instead
    if (this.chunkStore.containsItem(cKey)) {
      const cdata = this.chunkStore.getItem(cKey);

      if (isContiguousSelection(outSelection) && isTotalSlice(chunkSelection, this.chunks)) { // AND no filters
        // Optimization: we want the whole chunk, and the destination is
        // contiguous, so we can decompress directly from the chunk
        // into the destination array

        // TODO check order

        // TODO decompression

        console.log("optimized set", chunkSelection, this.chunks);
        return out.set(this.getTypedArray(cdata));
      }

      // Decode chunk
      const chunk = this.decodeChunk(cdata);
      const tmp = chunk.slice(chunkSelection);

      if (dropAxes !== null) {
        throw new Error("Drop axes is not supported yet");
      }

      if (typeof tmp === "number") {
        throw new ValueError("Scalar setting of NestedArrays not supported yet");
      }

      out.set(tmp as NestedArray<T>, outSelection);

    } else { // Chunk isn't there, use fill value
      if (this.fillValue !== null) {
        console.log(`Setting fill value into ${out}, selection: ${JSON.stringify(outSelection)}, value ${this.fillValue}`);
        throw new Error("Not implemented yet");
      }
    }
  }

  private getTypedArray<T extends TypedArray>(buffer: ValidStoreType): NestedArray<T> {
    if (typeof buffer === "string") {
      buffer = Buffer.from(buffer);
    }
    return new NestedArray<T>(buffer, this.chunks, this.dtype);
  }

  private chunkKey(chunkCoords: number[]) {
    return this.keyPrefix + chunkCoords.join(".");
  }

  private decodeChunk(cdata: ValidStoreType) {
    const chunk = cdata;
    // TODO decompression, filtering etc 
    return this.getTypedArray(chunk);
  }

  public setItem(selection: ArraySelection, value: any) {
    this.setBasicSelection(selection, value);
  }

  public setBasicSelection(selection: ArraySelection, value: any) {
    if (this.readOnly) {
      throw new PermissionError("Object is read only");
    }

    if (!this.cacheMetadata) {
      this.loadMetadata();
    }

    if (this.shape === []) {
      throw new Error("Shape [] indexing is not supported yet");
    } else {
      this.setBasicSelectionND(selection, value);
    }
  }

  private setBasicSelectionND(selection: ArraySelection, value: any) {
    const indexer = new BasicIndexer(selection, this);
    this.setSelection(indexer, value);
  }

  private setSelection(indexer: Indexer, value: number | NestedArray<TypedArray>) {
    // We iterate over all chunks which overlap the selection and thus contain data
    // that needs to be replaced. Each chunk is processed in turn, extracting the
    // necessary data from the value array and storing into the chunk array.

    // N.B., it is an important optimisation that we only visit chunks which overlap
    // the selection. This minimises the number of iterations in the main for loop.

    // TODO? check fields are sensible

    // Determine indices of chunks overlapping the selection
    const selectionShape = indexer.shape;

    // Check value shape
    if (selectionShape === []) {
      // Setting a single value
    } else if (typeof value === "number") {
      // Setting a scalar value
    } else if (value instanceof NestedArray) {
      // TODO: non stringify equality check
      if (JSON.stringify(value.shape) !== JSON.stringify(selectionShape)) {
        throw new ValueError(`Shape mismatch in source NestedArray and set selection: ${value.shape} and ${selectionShape}`);
      }
    } else {
      // TODO support TypedArrays, buffers, etc
      throw new Error("Unknown data type for setting :(");
    }

    // Iterate over chunks in range
    for (let proj of indexer.iter()) {
      let chunkValue = null;

      if (selectionShape === []) {
        chunkValue = value;
      } else if (typeof value === "number") {
        chunkValue = value;
      } else {
        chunkValue = value.slice(proj.outSelection);

        // tslint:disable-next-line: strict-type-predicates
        if (indexer.dropAxes !== null) {
          throw new Error("Handling drop axes not supported yet");
        }
      }

      this.chunkSetItem(proj.chunkCoords, proj.chunkSelection, chunkValue);
    }
  }

  private chunkSetItem(chunkCoords: number[], chunkSelection: DimensionSelection[], value: number | NestedArray<TypedArray>) {
    // Obtain key for chunk storage
    const cKey = this.chunkKey(chunkCoords);

    let chunk: null | TypedArray = null;

    const dtypeConstr = dtypeMapping[this.dtype];
    const chunkSize = this.chunkSize;

    if (isTotalSlice(chunkSelection, this.chunks)) {
      // Totally replace chunk

      // Optimization: we are completely replacing the chunk, so no need
      // to access the existing chunk data

      if (typeof value === "number") {
        // TODO get the right type here
        chunk = new dtypeConstr(chunkSize);
        chunk.fill(value);
      } else {
        chunk = value.flatten();
      }
    } else {
      // partially replace the contents of this chunk

      // TODO TODO TODO
    }

  }



}
