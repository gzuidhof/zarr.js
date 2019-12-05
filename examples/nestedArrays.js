import { NestedArray } from "../dist/zarr.es5.mjs";
import { slice } from "../dist/zarr.es5.mjs";

function example1() {
    const typedArray = Int32Array.from([0,1,2,3,4,5]);
    const nArray = new NestedArray(typedArray, [2, 3]);

    console.log(nArray);
}

function example2() {
    const binaryData = new ArrayBuffer(8*2*3*64);
    // We will have to specify the type as it can not be inferred.
    const nArray = new NestedArray(binaryData, [2, 3, 64], "<f8");

    console.log(nArray);
}

function example3() {
    const typedArray = Int32Array.from([0,1,2,3,4,5]);
    let n = new NestedArray(typedArray, [2, 3]);

    console.log(n);


    for(const s of [
        n.get([0]).data, // Int32Array [ 0, 1, 2 ]
        n.get(0).data, // Int32Array [ 0, 1, 2 ]
        n.get(-1).data, // Int32Array [ 0, 1, 2 ]
        n.get([0, 0]), // 0
        n.get([-1, 0]), // 3
        n.get([-1, 1]), // 4

        n.get(null).data,
        n.get([slice(null), slice(0, 2)]).data,
        n.get([slice(null, null, -1), slice(0, 2)]).data,
        n.get(["...", slice(0, 2)]).data, // [ Int32Array [ 0, 1 ], Int32Array [ 3, 4 ] ]

    
    ]) {
        console.log(s);
    }
}

function example4() {
    const typedArray = Int32Array.from([0,1,2,3,4,5]);
    let n = new NestedArray(typedArray, [2, 3]);

    for(const s of [
        () => n.set([1, 1], 100),
        () => n.set([1, slice(0, 2)], 100),
        () => n.set([1, 1], 100),
        () => n.set([null], 100),
        () => n.set([null], n.get([null, slice(null, null, -1)])),
        () => n.set([null, slice(0,2)], n.get([null, slice(1,3)])),
        () => n.set(0, n.get(1)),

    ]) {
        s();
        console.log(n.data);
        n = new NestedArray(typedArray, [2, 3]);
    }
}



// console.log("\nExample 1");
// example1();


// console.log("\nExample 2");
// example2();

// console.log("\nExample 3");
// example3();

console.log("\nExample 4");
example4();
