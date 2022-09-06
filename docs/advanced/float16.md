# float16 data

In Zarr.js, each array "chunk" is decompressed as a raw
[`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer),
and
[typed arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays) are used to
provide a context-aware _view_ of the underlying binary data.

Unlike `Float32Array` and `Float64Array`, browsers do not implement a typed
array to view buffers containing
[half-precision floating point data](https://en.wikipedia.org/wiki/Half-precision_floating-point_format)
(`<f2`/`>f2` data types). By default, Zarr.js throws an error if you attempt to read or write this data type.

```javascript
import { openArray } from "zarr";

let z = await openArray({ store: "http://example.com/data_f2.zarr" });
z.dtype === "<f2" // true
await z.getRaw(null) // throws: '<f2' is not supported natively in zarr.js. In order to access this dataset you must make Float16Array available as a global. See https://github.com/gzuidhof/zarr.js/issues/127
```

However, users may provide a global _polyfill_ for [`Float16Array`](https://github.com/petamoriken/float16) 
to add support for this data type if necessary.

```javascript
import { Float16Array } from "@petamoriken/float16";
// !Important! Make sure this global is set _before_ importing Zarr.js
globalThis.Float16Array = Float16Array;

import { openArray } from "zarr";

let z = await openArray({ store: "http://example.com/data_f2.zarr" });
z.dtype === "<f2" // true
await z.getRaw(null)  // { data: Float16Array, ... }
```

You will also want to extend the `global` namespace for TypeScript to avoid type errors
and ensure that Zarr.js returns the correct type information for your environment.

```javascript
import type { Float16ArrayConstructor } from "@petamoriken/float16";

declare global {
  var Float16Array: Float16ArrayConstructor;
}
```
