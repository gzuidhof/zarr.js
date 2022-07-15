# Stores

Zarr abstracts over different backend stores where the data lives.

**Currently available stores:**
* `ObjectStore`: Data is stored in an in-memory Javascript object. This is Javascript's equivalent of the Python `dict` minimal store.
* `MemoryStore`: Data is stored in a nested in-memory Javascript object.
* `HTTPStore`: Data is stored at some remote prefix (e.g. `localhost:1234/my_dataset.zarr`). This would also work for zarr datasets stored in public buckets.

The `HTTPStore` uses [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) internally
to get and set chunks via HTTP requests. To have more granular control over these requests
(e.g. setting headers, etc), request options may be supplied when initializing the store.
These options are forwarded to each `fetch` call made internally by the store. 

Additionally, `supportedMethods` specifies which HTTP methods a given store supports.
If `HEAD` is listed (default), the store will use `HEAD` requests to check for items rather than 
making a full `GET` request and inspecting the response status.

```javascript
import { HTTPStore } from 'zarr';
const fetchOptions = { redirect: 'follow', headers: { 'custom-header': 'value' } };
const supportedMethods = ['GET', 'PUT', 'HEAD']; // defaults
const store = new HTTPStore('http://localhost:8000', { fetchOptions, supportedMethods });
```

# Remote datasets {docsify-ignore}

Most likely when you are using Zarr.js your ZarrArray data will actually live on a remote server in the zarr format, this is exactly the use-case that Zarr.js was created for :).

Let's run through an end-to-end example:

### Creating a Zarr dataset in Python
First we create some data in a Python script using the [Python zarr package](https://zarr.readthedocs.io/en/stable/) and persist it to disk:
```python
import numpy as np
import zarr

np.random.seed(0)

z = zarr.open(
    "dummy_dataset.zarr",
    shape=(3, 1000),
    chunks=(1, 500),
    compressor=None,
    dtype=np.float32,
)

z[0] = np.arange(1000)
z[1] = np.sin(np.arange(1000) / 100)
z[2] = np.random.rand(1000)

print("Index 0:", z[0, :5])
print("Index 1:", z[1, :5])
print("Index 2:", z[2, :5])
```
```output
Index 0: [0. 1. 2. 3. 4.]
Index 1: [0.         0.00999983 0.01999867 0.0299955  0.03998933]
Index 2: [0.5488135  0.71518934 0.60276335 0.5448832  0.4236548 ]
```


### Serving the zarr data files
Next, let's serve the files locally. We can use any HTTP server, to keep things simple let's use the one that ships with Python 3

```shell
python3 -m http.server
Serving HTTP on 0.0.0.0 port 8000 ...
```

### Using Zarr.js to access the data
```javascript
import { slice, openArray } from "zarr";

const z = await openArray({
    store: "http://localhost:8000/",
    path: "dummy_dataset.zarr",
    mode: "r"
});
console.log(z);
```
```output
ZarrArray {
  store: HTTPStore { url: 'http://localhost:8000/' },
  _chunkStore: HTTPStore { url: 'http://localhost:8000/' },
  path: 'dummy_dataset.zarr',
  keyPrefix: 'dummy_dataset.zarr/',
  readOnly: true,
  cacheMetadata: true,
  cacheAttrs: true,
  meta:
   { chunks: [ 1, 500 ],
     compressor: null,
     dtype: '<f4',
     fill_value: 0,
     filters: null,
     order: 'C',
     shape: [ 3, 1000 ],
     zarr_format: 2 },
  attrs:
   Attributes {
     store: HTTPStore { url: 'http://localhost:8000/' },
     key: 'dummy_dataset.zarr/.zattributes',
     readOnly: false,
     cache: true,
     cachedValue: null } }
```

> **Notes:**
  * The `HTTPStore` uses `fetch` to make requests. If you are running in Node you may need to install a package like `node-fetch` and expose it on the `global` object.
  *  We open the array with the `"r"` persistence mode, so the array will be *read only*. The python http server we are using does not support `PUT` method to upload or overwrite data.

----

Let's slice some data and see whether it matches the data saved in our Python script.

```javascript
console.log("Index 0:", await z.get([0, slice(null, 5)])); // z[0, :5]
console.log("Index 1:", await z.get([1, slice(null, 5)])); // z[1, :5]
console.log("Index 2:", await z.get([2, slice(null, 5)])); // z[2, :5]
```
```output
Index 0: NestedArray {
  shape: [ 5 ],
  dtype: '<f4',
  data: Float32Array [ 0, 1, 2, 3, 4 ] }

Index 1: NestedArray {
  shape: [ 5 ],
  dtype: '<f4',
  data:
   Float32Array [
     0,
     0.009999833069741726,
     0.019998665899038315,
     0.029995501041412354,
     0.03998933359980583 ] }

Index 2: NestedArray {
  shape: [ 5 ],
  dtype: '<f4',
  data:
   Float32Array [
     0.54881352186203,
     0.7151893377304077,
     0.6027633547782898,
     0.5448831915855408,
     0.42365479469299316 ] }
```

Looks like it worked 🎉.
Slicing across chunks is also not a problem, the next slice requires reading all 6 chunks:

```javascript
console.log(await z.get([null, slice(498, 503)])); // z[:, 498:503]
```
```output
NestedArray {
  shape: [ 3, 5 ],
  dtype: '<f4',
  data:
   [ Float32Array [ 498, 499, 500, 501, 502 ],
     Float32Array [
       -0.964405357837677,
       -0.9617128968238831,
       -0.9589242935180664,
       -0.9560397267341614,
       -0.9530596137046814 ],
     Float32Array [
       0.24841345846652985,
       0.5058664083480835,
       0.31038081645965576,
       0.37303486466407776,
       0.5249704718589783 ] ] }
```

## Good to know
Zarr.js is fairly stable, but still using this in production is at your own risk. Some notes on supported operations:

* #### Support for compressors and filters
Only `zlib`, `gzip`, and `blosc` compressors are supported at this point. No other compressors or filters are supported yet - they need to be implemented in [`numcodecs.js`](https://github.com/manzt/numcodecs.js) *(contributions are welcome)*.

* #### int64 support
  int64 support in browsers is tricky. Because all numbers are internally represented as floating point numbers, whole numbers larger than `2^53-1` can not be reliably represented. `BigInt` and `BigInt64Array` solve this, but they are [not supported in every modern browser](https://caniuse.com/#search=BigInt64Array) yet (in particular Edge and Safari). For maximum compatibility save yourself some hassle and try to avoid int64/uint64 zarr arrays.

* #### Ordering
~Only `C` order zarr arrays (default for numpy/zarr) are supported right now..~

  * `C` order zarr arrays are supported fully.
  * `F` order zarr arrays are supported by automatically converting chunks when they are loaded ([PR](https://github.com/gzuidhof/zarr.js/pull/124)).

* #### Broadcasting and complex indexing
NumPy-like [broadcasting](https://docs.scipy.org/doc/numpy/user/basics.broadcasting.html) is not supported.
  Indexing with binary masks or arrays of integers is also not supported (e.g. `x[[1,3,4]]` or `x[[False, True, False, True, True]]`).

## Known issues

* Open ended slicing with negative indices seems to have a bug. For example slice `x.get(slice(-5))` does not give the same results as `x[-5:]` in NumPy. *(contributions are welcome!)*
