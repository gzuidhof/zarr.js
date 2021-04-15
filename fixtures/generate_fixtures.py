import os

import zarr  # 2.7
from zarr.util import json_dumps, json_loads

FIXTURES_FOLDER = "./"


def generate_fixtures():

    empty_path = os.path.join(FIXTURES_FOLDER, "empty.zarr")
    zarr.open(
        empty_path,
        shape=(8, 8),
        chunks=(2, None),
        dtype="<i4",
        fill_value=0,
        mode="w",
        compressor=None,
    )

    # little endian
    for codec in (None, "gzip", "zlib"):
        simple_path = os.path.join(
            FIXTURES_FOLDER, "simple{}_LE.zarr".format(f"_{codec}" if codec else "")
        )
        simple_zarr_array = zarr.open(
            simple_path,
            shape=(8, 8),
            chunks=(2, None),
            dtype="<i4",
            fill_value=0,
            mode="w",
            compression=codec,
        )
        simple_zarr_array[0, 0] = 1
        simple_zarr_array[0, 1] = 2
        simple_zarr_array[7, 7] = 3

    # big endian
    for codec in (None, "gzip", "zlib"):
        simple_path = os.path.join(
            FIXTURES_FOLDER, "simple{}_BE.zarr".format(f"_{codec}" if codec else "")
        )
        simple_zarr_array = zarr.open(
            simple_path,
            shape=(8, 8),
            chunks=(2, None),
            dtype=">i4",
            fill_value=0,
            mode="w",
            compression=codec,
        )
        simple_zarr_array[0, 0] = 1
        simple_zarr_array[0, 1] = 2
        simple_zarr_array[7, 7] = 3

    # nested
    # TODO: Use latest zarr-python once https://github.com/zarr-developers/zarr-python/pull/716 is merged
    store = zarr.storage.FSStore(
        os.path.join(FIXTURES_FOLDER, "simple_nested.zarr"),
        key_separator="/",
        auto_mkdir=True,
    )

    nested = zarr.open(
        store,
        shape=(8, 8),
        chunks=(2, None),
        dtype=">i4",
        fill_value=0,
        mode="w",
    )
    nested[0, 0] = 1
    nested[0, 1] = 2
    nested[7, 7] = 3

    # Manually add dimension separator to array meta
    meta = json_loads(store[".zarray"])
    meta["dimension_separator"] = "/"
    store[".zarray"] = json_dumps(meta)


if __name__ == "__main__":
    generate_fixtures()
