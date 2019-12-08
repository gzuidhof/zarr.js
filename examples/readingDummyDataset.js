global.fetch = require('node-fetch');
import { NestedArray, slice, openArray } from "../dist/zarr.es5.js";

(async () => {
    const z = await openArray({ store: "http://localhost:8000/", path: "dummy_dataset.zarr", mode: "r" });
    console.log(z);

    // z[0, :5]
    console.log("Index 0:", await z.get([0, slice(null, 5)]));
    // z[1, :5]
    console.log("Index 1:", await z.get([1, slice(null, 5)]));
    // z[2, :5]
    console.log("Index 2:", await z.get([2, slice(null, 5)]));


    // z[:, 498:503]
    console.log(await z.get([null, slice(498, 503)]));
})()