import { Store } from "../../src/store/types";
import { createProxyForStore, pathToPrefix } from "../../src/store";

describe("Store Proxy", () => {
    const mockStore: Store<number> = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        deleteItem: jest.fn(),
        keys: jest.fn(),
        getProxy: jest.fn(),
    }

    const proxyStore = createProxyForStore(mockStore);

    it("catches set", () => {
        (mockStore.setItem as jest.Mock).mockReturnValue(true);
        proxyStore["a"] = 3;
        expect(mockStore.setItem).toHaveBeenCalledWith("a", 3);
    });

    it("catches get", () => {
        (mockStore.getItem as jest.Mock).mockReturnValue(true);
        proxyStore["a"];
        expect(mockStore.getItem).toHaveBeenCalledWith("a");
    });

    it("catches delete", () => {
        (mockStore.deleteItem as jest.Mock).mockReturnValue(true);
        delete proxyStore["a"];
        expect(mockStore.deleteItem).toHaveBeenCalledWith("a");
    });
});

describe("Store core functionality", () => {
    it("creates prefixes", () => {
        expect(pathToPrefix("")).toEqual("");
        expect(pathToPrefix("a")).toEqual("a/");
        expect(pathToPrefix("a/b")).toEqual("a/b/");
    });
})