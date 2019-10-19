import { Store } from "../../src/storage/types";
import { ObjectStore } from "../../src/storage/objectStore";

describe("Test ObjectStore", () => {
    const store = new ObjectStore<string>();
    const proxy = store.proxy();

    it("proxy works", () => {
        expect(() => proxy["a"]).toThrow();
        proxy["a"] = "3";
        expect(proxy["a"]).toEqual("3");
        expect(store.getItem("a")).toEqual("3");

        expect(delete proxy["a"]).toEqual(true);
        expect(() => proxy["a"]).toThrow();

        expect(store.keys()).toEqual([]);
        proxy["c"] = "bla";
        expect(proxy["c"]).toEqual("bla");
        expect(store.keys()).toEqual(["c"]);
    });

});
