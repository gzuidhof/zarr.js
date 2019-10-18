import { Store } from "../../src/storage/types";
import { ObjectStore } from "../../src/storage/objectStore";

describe("Test ObjectStore", () => {
    const objStore = new ObjectStore<number>().proxy();

    it("proxy works", () => {
        expect(() => objStore["a"]).toThrow();

        objStore["a"] = 3;
        expect(objStore["a"]).toEqual(3);

        expect(delete objStore["a"]).toEqual(true);
        expect(() => objStore["a"]).toThrow();
    });

});
