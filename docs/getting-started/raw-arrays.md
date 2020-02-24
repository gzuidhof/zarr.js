# Raw Arrays

A numpy-like standard for multi-dimensional arrays does not currently exist in Javascript. This might change in the future, but for now we offer the option to retrieve data from a zarr store as a RawArray. RawArrays are similar to NestedArrays except the `data` attribute is a *single* TypeArray, representing the multi-dimensional array using "C" order (row-major) *strides* instead of a nested Array of TypedArrays. The `ZarrArray.getRaw` method enables users to connect zarr.js with their favorite Javascript array library and also offers a convenient way to create images on the fly.

## Example

```javascript
import { slice, openArray } from "zarr";

const z = await openArray({
    store: "http://localhost:8000/",
    path: "dummy_dataset.zarr",
    mode: "r"
});

const { data, strides, shape } = await z.getRaw([0, null, null]);

const arr = tf.tensor(data, shape); // tensorflow.js
const arr2 = ndarray(data, shape) ; // ndarray

const [height, width] = shape;
const img = new ImageData(new Uint8ClampedArray(data), width, height);
```

## Direct Chunk Access

There may be a situation where a user would like to fetch a zarr chunk directly without specifying the slice indices. We provide the `ZarrArray.getRawChunk` method for this use case, which returns an instance of RawArray for a given *chunk key*. This is somewhat of an advanced feature and some knowledge of the [zarr schema](https://zarr.readthedocs.io/en/stable/spec/v1.html#chunks) is recommended before using.

```javascript
import { slice, openArray } from "zarr";

const z = await openArray({
    store: "http://localhost:8000/",
    path: "dummy_dataset.zarr",
    mode: "r"
});

console.log(z.chunkDataShape);
// [1, 4, 5]
console.log(z.chunks);
// [3, 512, 512]

// Get outermost chunk
const chunk = await z.getRawChunk([0, 3, 4]);
console.log(chunk.shape)
// [3, 512, 512]
```
