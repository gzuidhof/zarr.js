
import { Attributes } from "../src/attributes";
import { ObjectStore } from '../src/storage/objectStore';
import { ZarrMetadata } from '../dist/types/types';
import { ZarrGroupMetadata } from "../src/types";

describe("Attributes", () => {

    const configs = [
        { cache: true }, { cache: false }, { cache: undefined }
    ];

    for (const config of configs) {
        it("Shows basic behavior", () => {
            const store = new ObjectStore<string>();
            const a = new Attributes(store, "attrs", false, config.cache);
            const aProxy = a.proxy();

            expect('bar' in aProxy).toBeFalsy();
            expect('foo' in aProxy).toBeFalsy();
            expect(a.asObject()).toEqual({});

            aProxy['foo'] = 'bar';
            aProxy['baz'] = 42;
            expect(store.containsItem("attrs")).toBeTruthy();
            expect(aProxy["foo"]).toEqual("bar");
            expect(JSON.parse(store.getItem("attrs"))).toEqual({ 'foo': 'bar', 'baz': 42 });
            a.deleteItem("foo");
            expect(JSON.parse(store.getItem("attrs"))).toEqual({ 'baz': 42 });

            a.put({ "hello": "ok" });
            expect(JSON.parse(store.getItem("attrs"))).toEqual({ 'hello': 'ok' });
        });

        it("Respects read only", () => {
            const store = new ObjectStore<string>();
            const a = new Attributes(store, "attrs", true, config.cache);
            const aProxy = a.proxy();
            expect(() => a.put({})).toThrow();
            expect(() => a.setItem("key", "value")).toThrow();
            expect(() => aProxy["key"] = "value").toThrow();
            expect(() => a.deleteItem("key")).toThrow();
            expect(() => delete aProxy["key"]).toThrow();
        });

        it("Can deal with already object metadata (instead of string)", () => {
            const store = new ObjectStore<Object>();
            const att = new Attributes(store, "attrs", false, config.cache);
            store.setItem("attrs", { "a": "b" });
            expect(att.getItem("a")).toEqual("b");
        });
    }




});
