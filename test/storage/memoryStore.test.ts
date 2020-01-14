import { MemoryStore } from "../../src/storage/memoryStore";

describe("Test MemoryStore", () => {
    const memStore = new MemoryStore<string>().proxy();

    it("proxy works", () => {
        expect(() => memStore["a"]).toThrow();

        memStore["a"] = "3";
        expect(memStore["a"]).toEqual("3");

        expect(delete memStore["a"]).toEqual(true);
        expect(() => memStore["a"]).toThrow();
    });

});
