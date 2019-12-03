# Getting Started

## Installation

Zarr.js can both be used in the browser as well as in a Node application.

### Browser

```html
<!-- Import as UMD -->
<script src="https://unpkg.com/zarr/dist/zarr.umd.js"></script>

<!-- Import as ES5/ES6 module -->
<script src="https://unpkg.com/zarr/dist/zarr.es5.js" type="module"></script>
```

You can now use it as such
```html
<script>
// UMD import
async function exampleUMD() {
    const store = new zarr.ObjectStore();
    const myZarrArray = await zarr.ones([3, 4], {store, chunks: [1, 2]});

    console.log(myZarrArray.chunks); // [1, 2]

    const arr = await myZarrArray.get([zarr.slice(0, 2)]);
    
    console.log(arr instanceof zarr.NestedArray); // true
    console.log(arr.shape); // [2, 4]
}
exampleUMD();
</script>
```

```html
// ES5 import
<script type="module">
import {ObjectStore, ones, slice, NestedArray} from "https://unpkg.com/zarr/dist/zarr.es5.js";

async function exampleES5() {
    
    const store = new ObjectStore();
    const myZarrArray = await ones([3, 4], {store, chunks: [1, 2]});

    console.log(myZarrArray.chunks); // [1, 2]

    const arr = await myZarrArray.get([slice(0, 2)]);
    
    console.log(arr instanceof NestedArray); // true
    console.log(arr.shape); // [2, 4]
}
exampleES5();
</script>
```


### Node

```bash
# Install using npm
npm i zarr

# Install using yarn
yarn add zarr
```

### Building from source
Clone the github repository, and run
```bash
npm run build
```

The built files are now available as `dist/zarr.es5.js` and `dist/zarr.umd.js`.
