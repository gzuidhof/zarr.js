import { Store } from "../../src/store/types";
import { pathToPrefix } from "../../src/store";

describe("Store core functionality", () => {
    it("creates prefixes", () => {
        expect(pathToPrefix("")).toEqual("");
        expect(pathToPrefix("a")).toEqual("a/");
        expect(pathToPrefix("a/b")).toEqual("a/b/");
    });
})