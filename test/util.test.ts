
import * as util from "../src/util";

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
})

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
    ])("normalizes path as expected: output %s, expected %p", (input: string | String, expected: string) => {
        expect(util.normalizeStoragePath(input)).toEqual(expected);
    })

    test.each([
        ".",
        "..",
        "a/..",
        "a/./a",
        undefined,
    ])("doesn't allow relative paths, rejects invalid input: output %s, expected %p", (input) => {
        expect(() => util.normalizeStoragePath(input)).toThrow();
    })
})