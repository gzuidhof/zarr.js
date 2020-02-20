# Raw Arrays

Currently there is not a `numpy`-like standard for multi-dimensional arrays in Javascript. This might change in the future, but for now we offer the option to retrieve data from a zarr store as a RawArray. RawArrays include a *single* TypeArray which represents the underlying multi-dimensional using *C* order (row-major) *strides*.

## Example

```javascript
import { slice, openArray } from "zarr";

const z = await openArray({
    store: "http://localhost:8000/",
    path: "dummy_dataset.zarr",
    mode: "r"
});

const { data, strides, shape } = await z.getRaw([null, null]);

const arr = tf.tensor(data, shape); // tensorflow.js
const arr2 = ndarray(data, shape) ; // ndarray
const img = new ImageData(new Uint8ClampedArray(data), shape[0], shape[1]);
```

## Direct Chunk Access

There might be a situation where a user would like to fetch a zarr chunk directly without specifying the slice indices. We provide the `ZarrArray.getRawChunk` method for this use case, which returns an instance of RawArray.

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
