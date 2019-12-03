# Stores

Zarr abstracts over different backend stores where the data lives.  

**Currently available stores:**
* `ObjectStore`: Data is stored in an in-memory Javascript object. This is Javascript's equivalent of the Python `dict` minimal store.
* `MemoryStore`: Data is stored in a nested in-memory Javascript object.
* `HTTPStore`: Data is stored at some remote prefix (e.g. `localhost:1234/my_dataset.zarr`). This would also work for zarr datasets stored in public buckets.

**Planned stores:**
* `LocalStorageStore`: Data is stored in `LocalStorage`, which lives on the user's disk and is persistent through reloads.
* `SessionStorageStore`: The same as above, but not persistent through reloads.
* `IndexedDBStore`: Similar to LocalStorage, but generally has a much higher maximum storage capacity.
