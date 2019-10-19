
import { createProxy } from "../src/mutableMapping";
import { MutableMapping } from '../dist/types/mutableMapping';

describe("Store Proxy", () => {
    const mockStore: MutableMapping<any> = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        deleteItem: jest.fn(),
        containsItem: jest.fn(),
        proxy: jest.fn(),
    };

    const proxyStore = createProxy(mockStore);

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

    it("catches contains", () => {
        (mockStore.containsItem as jest.Mock).mockReturnValue(true);
        "a" in proxyStore;
        expect(mockStore.containsItem).toHaveBeenCalledWith("a");
    });
});