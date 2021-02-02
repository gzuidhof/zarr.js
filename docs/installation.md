# Installation

Zarr.js can be used in the browser as well as in Node applications.

> See also the [**Zarr.js npm page**](https://www.npmjs.com/package/zarr).


## Typescript / Node / Web App

```shell
# Install using npm
npm i zarr

# Install using yarn
yarn add zarr
```

**Example**
```javascript
import { ObjectStore, ones, slice, NestedArray } from "zarr";

async function example() {
    const store = new ObjectStore();

    const myZarrArray = await ones([3, 4], { store, chunks: [1, 2] });
    console.log(myZarrArray.chunks); // [1, 2]

    const arr = await myZarrArray.get([slice(0, 2)]);
    console.log(arr instanceof NestedArray); // true
    console.log(arr.shape); // [2, 4]
}

example();
```

## Browser

### ES Module

Importing as an ES module is the more modern and preferred approach. If you are building an application and have a build pipeline, consider using the npm instructions above.

> For a primer on use of (ECMAscript) modules directly in the browser see [this guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

```js
// Import invidual classes and functions.
import { HTTPStore, openArray, slice } from "https://cdn.skypack.dev/zarr";

// Or import everything in one go
import * as zarr from "https://cdn.skypack.dev/zarr";
```

**Example**
```html
<!-- ES import -->
<script type="module">
    import { ObjectStore, ones, slice, NestedArray } from "https://cdn.skypack.dev/zarr";

    async function exampleES6() {
        const store = new ObjectStore();

        const myZarrArray = await ones([3, 4], { store, chunks: [1, 2] });
        console.log(myZarrArray.chunks); // [1, 2]

        const arr = await myZarrArray.get([slice(0, 2)]);
        console.log(arr instanceof NestedArray); // true
        console.log(arr.shape); // [2, 4]
    }

    exampleES6();
</script>
```

### UMD

```html
<!-- Import as UMD in HTML -->
<script src="https://unpkg.com/zarr/dist/zarr.umd.js"></script>
```
**Example**
```html
<!-- UMD import -->
<script>
    async function exampleUMD() {
        const store = new zarr.ObjectStore();

        const myZarrArray = await zarr.ones([3, 4], { store, chunks: [1, 2] });
        console.log(myZarrArray.chunks); // [1, 2]

        const arr = await myZarrArray.get([zarr.slice(0, 2)]);
        console.log(arr instanceof zarr.NestedArray); // true
        console.log(arr.shape); // [2, 4]
    }

    exampleUMD();
</script>
```


## Building from source
Clone the [Zarr.js github repository](https://github.com/gzuidhof/zarr.js), and run
```bash
npm run build
```

The built files are now available as `dist/zarr.mjs`, `dist/zarr.cjs`, and `dist/zarr.umd.js`.

## Zarr.js `core` export
The top-level `esm`, `cjs` and `umd` exports of `zarr.js` bundle a _complete_ registry
of all compressors provided by `numcodecs.js`. This makes it easy for developers to
get started with `zarr.js`, but leads to larger bundle sizes than are necessary for
many applications. 

We provide a `core` package export for `zarr.js` which bundles _zero_ codecs and
offers the flexibilty to define a custom registry. This is useful for use cases where
array compression is known before runtime or users want more granular control over how 
codec modules are imported (e.g. code-split, dynamic imports).

Use `addCodec` to supply an `id` (e.g. `gzip`, `zlib`, `blosc`) and a custom function
that returns the corresponding `Codec | Promise<Codec>` for your application. Here
is an example using the `core` export from an ES module CDN: 

```javascript
import { addCodec, openArray } from "https://cdn.skypack.dev/zarr/core";

openArray({ store: "https://localhost:8000/data.zarr" });
// ^ This will error unless compressor === null. No codecs are included in the core export.

// Define custom registry

// Top-level, non-dynamic import (default in zarr.js)
import Zlib from "https://cdn.skypack.dev/numcodecs/zlib"; 
addCodec(Zlib.codecId, () => Zlib);

// Dynamic import 
addCodec("blosc", async () => (await import("https://cdn.skypack.dev/numcodecs/blosc")).default);

const z = await openArray({ store: "https://localhost:8000/data.zarr" });
// ^ Imports necessary codec as defined above
```

Usage with a bundler will likely look as follows:

```javascript
import { openArray, addCodec } from "zarr/core";

// All codecs will be code-split and dynamically imported at runtime
addCodec("gzip", async () => (await import("numcodecs/gzip")).default);
addCodec("zlib", async () => (await import("numcodecs/zlib")).default);
addCodec("blosc", async () => (await import("numcodecs/blosc")).default);

const z = await openArray({ store: "https://localhost:8000/data.zarr" });
```
