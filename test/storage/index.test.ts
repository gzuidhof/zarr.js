import { Store } from "../../src/storage/types";
import { pathToPrefix } from "../../src/storage";

describe("Store core functionality", () => {
    it("creates prefixes", () => {
        expect(pathToPrefix("")).toEqual("");
        expect(pathToPrefix("a")).toEqual("a/");
        expect(pathToPrefix("a/b")).toEqual("a/b/");
    });
})