import { RawArray } from "../../src/rawArray";


describe("RawArray interface", () => {

    it("errors given invalid buffer size", () => {
        expect(() => new RawArray(new ArrayBuffer(16), [2], "<i8")).not.toThrowError();
        expect(() => new RawArray(new ArrayBuffer(7), [2], "<i8")).toThrowError();
        expect(() => new RawArray(new ArrayBuffer(8), [2], "<i4")).not.toThrowError();
        expect(() => new RawArray(new ArrayBuffer(7), [2], "<i4")).toThrowError();
        expect(() => new RawArray(new ArrayBuffer(4), [2], "<i4")).toThrowError();
        expect(() => new RawArray(new ArrayBuffer(16), [2], "<i4")).toThrowError();
    });


    it("errors when not passing required params", () => {
        expect(() => new RawArray(new ArrayBuffer(8) as any, [2])).toThrowError();
        expect(() => new RawArray(new ArrayBuffer(8) as any, undefined, "<i4")).toThrowError();
        expect(() => new RawArray(new ArrayBuffer(8) as any, undefined, "<i8")).toThrowError();
    });

});
