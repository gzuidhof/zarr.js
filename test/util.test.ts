
import * as util from "../src/util";

describe("Node check", () => {
    it("detects that the tests run in Node", () => {
        expect(util.IS_NODE).toBeTruthy();
    });
});


describe("Human Readable Size", () => {
    it("describes values as expected", () => {
        expect(util.humanReadableSize(100)).toEqual("100");
        expect(util.humanReadableSize(2 ** 10)).toEqual("1.0K");
        expect(util.humanReadableSize(2 ** 20)).toEqual("1.0M");
        expect(util.humanReadableSize(2 ** 30)).toEqual("1.0G");
        expect(util.humanReadableSize(2 ** 40)).toEqual("1.0T");
        expect(util.humanReadableSize(2 ** 50)).toEqual("1.0P");

        expect(util.humanReadableSize(1234)).toEqual("1.2K");
        expect(util.humanReadableSize(1299)).toEqual("1.3K");
    });
});

describe("NormalizePath", () => {
    test.each([
        [null, ""],
        ["a", "a"],
        ["a/a", "a/a"],
        ["a//a", "a/a"],
        ["", ""],

        ["a\\a", "a/a"],
        ["a\\\\a", "a/a"],
        ["a\\/a", "a/a"],

        ["a///b//c/d", "a/b/c/d"],
        ["/a", "a"],
        ["/a/b/", "a/b"],

        [new String("a/b"), "a/b"],
        // eslint-disable-next-line @typescript-eslint/ban-types
    ])("normalizes path as expected: output %s, expected %p", (input: string | String | null, expected: string) => {
        expect(util.normalizeStoragePath(input)).toEqual(expected);
    });

    test.each([
        ".",
        "..",
        "a/..",
        "a/./a",
        undefined,
    ])("doesn't allow relative paths, rejects invalid input: output %s, expected %p", (input) => {
        expect(() => util.normalizeStoragePath(input as any)).toThrow();
    });
});

describe("ArrayEquals1D works", () => {
    test.each([
        [1, 2, 3],
        ["a", 1, "b"],
        [3, 0, undefined, true],
        [],
    ])("1D Array should have been equal", (...arr: any) => {
        expect(util.arrayEquals1D(arr, arr.slice(0))).toBeTruthy();
    });

    expect(util.arrayEquals1D([], [])).toBeTruthy();

    test.each([
        [[1, 2, 3], [1, "2", 3]],
        [["a"], []],
        [[undefined], []],
    ])("1D Array should not be equal", (arrA, arrB) => {
        expect(util.arrayEquals1D(arrA, arrB)).toBeFalsy();
    });
});

describe("URL joining works", () => {
    test.each<[[string | URL, string | undefined], string]>([
        [["https://example.com", "bla"], "https://example.com/bla"],
        [["https://example.com/my-store", "arr.zarr"], "https://example.com/my-store/arr.zarr"],
        [["https://example.com/", "arr.zarr"], "https://example.com/arr.zarr"],
        [["https://example.com/?hello=world", "arr.zarr"], "https://example.com/arr.zarr?hello=world"],
        [["https://example.com?hello=world", "arr.zarr"], "https://example.com/arr.zarr?hello=world"],
        [["https://example.com/arr.zarr/my-store/", ".zarray"], "https://example.com/arr.zarr/my-store/.zarray"],
        [[(() => {
            const root = new URL("https://example.com/arr.zarr/my-store/");
            root.searchParams.set("hello", "world");
            root.searchParams.set("foo", "bar");
            return root;
        })(), ".zarray"], "https://example.com/arr.zarr/my-store/.zarray?hello=world&foo=bar"],
    ])("joins parts as expected: output %s, expected %p", ([root, path]: [string | URL, string], expected: string) => {
        expect(util.resolveUrl(root, path)).toEqual(expected);
    });
});

describe("Inplace byte swapping works", () => {
    test.each([
        [new Uint32Array([1, 2, 3, 4, 5]), new Uint32Array([1, 2, 3, 4, 5])],
        [new Float64Array([20, 3333, 444.4, 222, 3123]), new Float64Array([20, 3333, 444.4, 222, 3123])],
        [new Float32Array([1, 2, 3, 42, 5]), new Float32Array([1, 2, 3, 42, 5])],
        [new Uint8Array([1, 2, 3, 4]), new Uint8Array([1, 2, 3, 4])],
        [new Int8Array([-3, 2, 3, 10]), new Int8Array([-3, 2, 3, 10])],
    ])('ensure twice flipped %p is same as %p', (arr, expected) => {
        util.byteSwapInplace(arr); // flip endiness inplace
        util.byteSwapInplace(arr); // flip again
        expect(arr).toEqual(expected);
    });
});

describe("Byte swapping does not mutate in input buffer", () => {
    test.each([
        [new Uint32Array([1, 2, 3, 4, 5]), 3, 4, 6, new Uint32Array([1, 2, 3, 6, 5])],
        [new Float64Array([-3, 2, 3, 10]), 0, -3, 200, new Float64Array([200, 2, 3, 10])],
    ])('ensure twice flipped %p is same as %p', (arr, index, origVal, newVal, expected) => {
        const copy1 = util.byteSwap(arr);
        const copy2 = util.byteSwap(copy1);
        copy2[index] = newVal;
        expect(copy2).toEqual(expected);
        expect(arr[index]).toEqual(origVal);
    });
});
