import { Store, StoreProxy } from "../../src/store/types";
import { createProxyForStore } from "../../src/store";
import { MemoryStore } from "../../src/store/memoryStore";

describe("Test MemoryStore", () => {
    const memStore = new MemoryStore<number>().getProxy();

    it("proxy works", () => {
        expect(() => memStore["a"]).toThrow();

        memStore["a"] = 3;
        expect(memStore["a"]).toEqual(3);

        expect(delete memStore["a"]).toEqual(true);
        expect(() => memStore["a"]).toThrow();
    });

})
