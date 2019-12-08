import * as zarr from "../dist/zarr.es5.js";

async function example1() {
    const z = await zarr.zeros([1000, 1000], {chunks: [100, 100], dtype: '<i4'})
    console.log(z);
}

async function example2() {
    const z = await zarr.zeros([1000, 1000], {chunks: [100, 100], dtype: '<i4'});
    await z.set(null, 42);
    await z.set([0, null], zarr.NestedArray.arange(1000, "<i4")); 
    await z.set([null, 0], zarr.NestedArray.arange(1000, "<i4")); 
    console.log(await z.get([0, 0]));
    console.log(await z.get([-1, -1]));
    console.log(await z.get([0, null]))
    console.log(await z.get([null, 0]))
    console.log((await z.get(null)).shape) // Printing the array itself spams the console a lot
}


(async () => {
    // await example1();
    await example2();
    
})()
