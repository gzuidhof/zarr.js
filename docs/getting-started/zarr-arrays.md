# ZarrArrays

Quote from the Python zarr documentation:  
*\"Zarr provides classes and functions for working with N-dimensional arrays that behave like NumPy arrays but whose data is divided into chunks and each chunk is compressed. If you are already familiar with HDF5 then Zarr arrays provide similar functionality, but with some additional flexibility.\"*

## Creating a ZarrArray

```javascript
import {zeros, NestedArray, slice} from "zarr";
const z = zeros([10000, 10000], {chunks: [1000, 100], dtype: '<i4'})
console.log(z);
```
```output
ZarrArray {
  store: MemoryStore { ... },
  meta: {
    shape: [ 10000, 10000 ],
    chunks: [ 1000, 100 ],
    dtype: '<i4',
    fill_value: 0,
    ...
  },
  attrs: ...,
  ...
}
```

The code above creates a 2-dimensional array of 32-bit integers with 10000 rows and 10000 columns, divided into chunks where each chunk has 1000 rows and 1000 columns (and so there will be 100 chunks in total).


## Reading and writing data
Zarr arrays supports the same interface as [NestedArrays](/getting-started/nested-arrays) for reading and writing data. For example, the entire array can be filled with a scalar value:
```javascript
await z.set(null, 42);
```

Regions of the array can also be written to, e.g.:
```javascript
z.set([0, null], NestedArray.arange(10000));
z.set([null, 0], = NestedArray.arange(10000));
```