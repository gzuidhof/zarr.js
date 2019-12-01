![Zarr.js Logo](logo.png)
Typescript implementation of [Zarr](https://zarr.readthedocs.io/en/stable/)  
Zarr is a library for chunked, compressed, N-dimensional arrays.

## Why a Typescript implementation for Zarr?
For better or for worse the browser environment is slowly becoming the world's operating system. Numerical computing with a lot of data is a poor fit for browsers, but for data visualization, exploration and result-sharing the browser is unparalleled.

With this library a workflow as such becomes possible:
* You run an experiment/workflow in Python or Julia. 
* You write results to a Zarr store, perhaps one that lives in some cloud storage.
* In a browser you create a visualization suite which allows for some interactivity. 
* You share a link to a colleague or friend.

## Store backends
Zarr abstracts over different backend stores where the data lives.  

**Currently available stores:**
* `ObjectStore`: Data is stored in an in-memory Javascript object. This is Javascript's equivalent of the Python `dict` minimal store.
* `MemoryStore`: Data is stored in a nested in-memory Javascript object.
* `HTTPStore`: Data is stored at some remote prefix (e.g. `localhost:1234/my_dataset.zarr`). This would also work for zarr datasets stored in public buckets.

**Planned stores:**
* `LocalStorageStore`: Data is stored in `LocalStorage`, which lives on the user's disk and is persistent through reloads.
* `SessionStorageStore`: The same as above, but not persistent through reloads.
* `IndexedDBStore`: Similar to LocalStorage, but generally has a much higher maximum storage capacity.

## Thoughts
* Currently no compression settings are supported. Some compression schemes (e.g. LZMA) will be easy to port, whereas others like the Blosc family will likely require compilation to WASM.
* No great substitute for NumPy exists in the browser, I don't expect that serious data manipulation workflows will move to the browser any time soon.
* This library represents multidimensional arrays as nested arrays of TypedArrays, similar as Pyodide. Operataions such as slicing and setting all had to be implemented from scratch to mimic NumPy as closely as possible
