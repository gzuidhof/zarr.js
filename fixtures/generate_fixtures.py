import os

import zarr
from zarr.creation import create  # 2.7
from zarr.util import json_dumps, json_loads

FIXTURES_FOLDER = "./"


def create_simple_array(store, dtype, compression=None, write_chunks=False):
    arr = zarr.open(
        store=store,
        shape=(8, 8),
        chunks=(2, None),
        dtype=dtype,
        fill_value=0,
        mode="w",
        compression=compression,
    )
    if write_chunks:
        arr[0, 0] = 1
        arr[0, 1] = 2
        arr[7, 7] = 3


def generate_fixtures():

    # Empty fixture
    create_simple_array(os.path.join(FIXTURES_FOLDER, "empty.zarr"), dtype="<i4")

    # little endian
    for codec in (None, "gzip", "zlib"):
        path = os.path.join(
            FIXTURES_FOLDER, "simple{}_LE.zarr".format(f"_{codec}" if codec else "")
        )
        create_simple_array(
            store=path,
            dtype="<i4",
            compression=codec,
            write_chunks=True,
        )

    # big endian
    for codec in (None, "gzip", "zlib"):
        path = os.path.join(
            FIXTURES_FOLDER, "simple{}_BE.zarr".format(f"_{codec}" if codec else "")
        )
        create_simple_array(
            store=path,
            dtype=">i4",
            compression=codec,
            write_chunks=True,
        )

    # nested
    # TODO: Use latest zarr-python once https://github.com/zarr-developers/zarr-python/pull/716 is merged
    store = zarr.storage.FSStore(
        os.path.join(FIXTURES_FOLDER, "simple_nested.zarr"),
        key_separator="/",
        auto_mkdir=True,
    )
    create_simple_array(
        store=store, dtype=">i4", compression="blosc", write_chunks=True
    )
    # Manually add dimension separator to array meta
    meta = json_loads(store[".zarray"])
    meta["dimension_separator"] = "/"
    store[".zarray"] = json_dumps(meta)


if __name__ == "__main__":
    generate_fixtures()
