
import { replaceEllipsis, normalizeIntegerSelection } from '../../src/core/indexing';
import { slice } from "../../src/core/slice";

describe("normalizeIntegerSelection", () => {
    it("normalizes integer selections", () => {
        expect(normalizeIntegerSelection(1, 100)).toEqual(1);
        expect(normalizeIntegerSelection(-1, 100)).toEqual(99);
    });

    it("errors with invalid input", () => {
        expect(() => normalizeIntegerSelection(100, 100)).toThrowError();
        expect(() => normalizeIntegerSelection(1000, 100)).toThrowError();
        expect(() => normalizeIntegerSelection(-1000, 100)).toThrowError();
    });
});

describe("Ellipsis Selection", () => {
    const testCases =
        test.each([
            // expected, selection, shape

            // 1D, single item
            [[0], 0, [100]],

            // 1D
            [[null], "...", [100]],
            [[null], [null], [100]],
            [[[null, 100]], [[null, 100]], [100]],
            [[[0, null]], [[0, null]], [100]],
            [[null], [null, "..."], [100]],
            [[null], ["...", null], [100]],
            [[slice(0, 5)], slice(0, 5), [100]],
            [[slice(null)], slice(":"), [100]],
            [[slice(null)], slice(":", ":"), [100]],

            // 2D, single item
            [[0, 0], [0, 0], [100, 100]],
            [[-1, 1], [-1, 1], [100, 100]],

            // 2D, single col/row
            [[0, null], [0, null], [100, 100]],
            [[0, slice(null)], [0, slice(null)], [100, 100]],
            [[null, 0], [null, 0], [100, 100]],

            // 2D
            [[null, null], "...", [100, 100]],
            [[null, null], [null], [100, 100]],
            [[null, null], [null, null], [100, 100]],
            [[null, null], ["...", null], [100, 100]],
            [[null, null], [null, "..."], [100, 100]],
            [[null, slice(null)], ["...", slice(null)], [100, 100]],
            [[null, null], ["...", null, null], [100, 100]],
            [[null, null], [null, "...", null], [100, 100]],
            [[null, null], [null, null, "..."], [100, 100]],


        ])("replaceEllipsis(%p, %p)", (expected, selection, shape) => {
            expect(replaceEllipsis(selection, shape)).toEqual(expected);
        });

    it("errors with invalid input", () => {
        expect(() => replaceEllipsis(["...", "..."], [100, 100])).toThrowError();
        expect(() => replaceEllipsis([0, 1, 2], [100, 100])).toThrowError();
    });
});

describe("Slice creation", () => {
    it("errors with invalid input", () => {
        expect(() => slice("..." as any)).toThrowError();
        expect(() => slice(null, "..." as any)).toThrowError();
        expect(() => slice(":", "..." as any)).toThrowError();
        expect(() => slice(undefined as any)).toThrowError();
        expect(() => slice(5, 0)).toThrowError();

        // Non-step size 1
        expect(() => slice(0, 10, 2)).not.toThrowError();
        expect(() => slice(0, 10, -2)).not.toThrowError();
    });
});