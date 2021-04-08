import os

import zarr  # 2.7
from zarr.convenience import copy_store
from zarr.storage import DirectoryStore
from zarr.util import json_dumps, json_loads

FIXTURES_FOLDER = "./"

def generate_fixtures():

    empty_path = os.path.join(FIXTURES_FOLDER, "empty.zarr")
    empty_zarr_array = zarr.open(
        empty_path,
        shape=(8, 8),
        chunks=(2, None),
        dtype="<i4",
        fill_value=0,
        mode="w",
        compressor=None,
    )

    for codec, filename_postfix in ([None, "_LE"], ["gzip", "_gzip_LE"], ["zlib", "_zlib_LE"]):
        simple_path = os.path.join(
            FIXTURES_FOLDER, "simple{}.zarr".format(filename_postfix)
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

    for codec, filename_postfix in ([None, "_BE"], ["gzip", "_gzip_BE"], ["zlib", "_zlib_BE"]):
        simple_path = os.path.join(
            FIXTURES_FOLDER, "simple{}.zarr".format(filename_postfix)
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
    store = dict()
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

    # manually convert store
    nested_store = dict()
    for key, value in store.items():
        if key == ".zarray":
            # add missing field to .zarry metadata
            value = json_loads(value)
            value['dimension_separator'] = '/'
            value = json_dumps(value)
        else:
            # map keys from "Y.X" -> "Y/X"
            key = key.replace(".", "/")
        nested_store[key] = value

    # copy dict to directory
    copy_store(nested_store, DirectoryStore(os.path.join(FIXTURES_FOLDER, 'simple_nested.zarr')))


if __name__ == "__main__":
    generate_fixtures()
