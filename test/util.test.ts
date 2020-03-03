
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
    ])("normalizes path as expected: output %s, expected %p", (input: string | String, expected: string) => {
        expect(util.normalizeStoragePath(input)).toEqual(expected);
    });

    test.each([
        ".",
        "..",
        "a/..",
        "a/./a",
        undefined,
    ])("doesn't allow relative paths, rejects invalid input: output %s, expected %p", (input) => {
        expect(() => util.normalizeStoragePath(input)).toThrow();
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
    test.each([
        [["https://example.com", "bla"], "https://example.com/bla"],
        [["https://example.com/my-store", "arr.zarr"], "https://example.com/my-store/arr.zarr"],
        [["https://example.com/", "arr.zarr"], "https://example.com/arr.zarr"],
        [["https://example.com/", "", "arr.zarr"], "https://example.com/arr.zarr"],
    // eslint-disable-next-line @typescript-eslint/ban-types
    ])("joins parts as expected: output %s, expected %p", (parts: string[] | String, expected: string) => {
        expect(util.joinUrlParts(...parts)).toEqual(expected);
    });
});