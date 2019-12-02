import { Attributes } from '../src/attributes';
import { ObjectStore } from '../src/storage/objectStore';

describe('Attributes', () => {
    const configs = [{ cache: true }, { cache: false }, { cache: undefined }];

    for (const config of configs) {
        it('Shows basic behavior', async () => {
            const store = new ObjectStore<string>();
            const a = new Attributes(store, 'attrs', false, config.cache);
            expect(await a.asObject()).toEqual({});

            await a.setItem('foo', 'bar');
            await a.setItem('baz', 42);
            expect(store.containsItem('attrs')).toBeTruthy();
            expect(await a.getItem('foo')).toEqual('bar');
            expect(JSON.parse(store.getItem('attrs'))).toEqual({ foo: 'bar', baz: 42 });
            await a.deleteItem('foo');
            expect(JSON.parse(store.getItem('attrs'))).toEqual({ baz: 42 });

            await a.put({ hello: 'ok' });
            expect(JSON.parse(store.getItem('attrs'))).toEqual({ hello: 'ok' });
        });

        it('Respects read only', async () => {
            const store = new ObjectStore<string>();
            const a = new Attributes(store, 'attrs', true, config.cache);
            await expect(a.put({})).rejects.toBeTruthy();
            await expect(a.setItem('key', 'value')).rejects.toBeTruthy();
            expect(await a.getItem('key')).toBeUndefined();
            await expect(a.deleteItem('key')).rejects.toBeTruthy();
        });

        it('Can deal with already object metadata (instead of string)', async () => {
            const store = new ObjectStore<string>();
            const att = new Attributes(store, 'attrs', false, config.cache);
            store.setItem('attrs', { a: 'b' } as any);
            expect(await att.getItem('a')).toEqual('b');
        });
    }
});
