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
import { HTTPStore, openArray, slice } from "https://unpkg.com/zarr/dist/zarr.es5.js";

// Or import everything in one go
import * as zarr from "https://unpkg.com/zarr/dist/zarr.es5.js"
```

**Example**
```html
<!-- ES import -->
<script type="module">
    import { ObjectStore, ones, slice, NestedArray } from "https://unpkg.com/zarr/dist/zarr.es5.js";

    async function exampleES5() {
        const store = new ObjectStore();

        const myZarrArray = await ones([3, 4], { store, chunks: [1, 2] });
        console.log(myZarrArray.chunks); // [1, 2]

        const arr = await myZarrArray.get([slice(0, 2)]);
        console.log(arr instanceof NestedArray); // true
        console.log(arr.shape); // [2, 4]
    }

    exampleES5();
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

The built files are now available as `dist/zarr.es5.js` and `dist/zarr.umd.js`.
