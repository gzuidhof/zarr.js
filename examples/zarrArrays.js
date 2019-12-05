import * as zarr from "../dist/zarr.es5.js";

async function example1() {
    const z = await zarr.zeros([10000, 10000], {chunks: [1000, 100], dtype: '<i4'})
    console.log(z);
}

async function example2() {
    const z = await zarr.zeros([10000, 10000], {chunks: [1000, 100], dtype: '<i4'});
    await z.set(null, 42);
    await z.set([0, null], zarr.NestedArray.arange(10000, "<i4")); 
    await z.set([null, 0], zarr.NestedArray.arange(10000, "<i4")); 
}


(async () => {
    const z = await example1();
    await example2();
    
})()
