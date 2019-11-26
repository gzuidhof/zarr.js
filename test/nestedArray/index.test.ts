import { NestedArray } from "../../src/nestedArray";


describe("NestedArray interface", async () => {


    it("errors given invalid buffer size", () => {
        expect(() => new NestedArray(new ArrayBuffer(8), [2], "<i4")).not.toThrowError();
        expect(() => new NestedArray(new ArrayBuffer(7), [2], "<i4")).toThrowError();
        expect(() => new NestedArray(new ArrayBuffer(4), [2], "<i4")).toThrowError();
        expect(() => new NestedArray(new ArrayBuffer(16), [2], "<i4")).toThrowError();
    });


    it("errors when not passing required params", () => {
        expect(() => new NestedArray(new ArrayBuffer(8) as any, [2])).toThrowError();
        expect(() => new NestedArray(new ArrayBuffer(8) as any, undefined, "<i4")).toThrowError();
    });

});
