import os

import zarr
from zarr.creation import create  # 2.7
from zarr.util import json_dumps, json_loads

FIXTURES_FOLDER = "./"


def create_simple_array(store, dtype, compression=None, order="C", ndim=2, write_chunks=False, dimension_separator=None):
    arr = zarr.open(
        store=store,
        shape=(8, 8) if ndim == 2 else (8, 8, 8),
        chunks=(2, None) if ndim == 2 else (2, None, None),
        dtype=dtype,
        fill_value=0,
        dimension_separator=dimension_separator,
        mode="w",
        compression=compression,
        order=order,
    )
    if write_chunks:
        if ndim == 2:
            arr[0, 0] = 1
            arr[0, 1] = 2
            arr[7, 7] = 3
        elif ndim == 3:
            arr[0, 0, 0] = 1
            arr[0, 0, 1] = 2
            arr[7, 0, 7] = 3


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

    # F-order
    path = os.path.join(FIXTURES_FOLDER, "simple_F.zarr")
    create_simple_array(
        store=path,
        dtype="<i4",
        compression=None,
        order="F",
        write_chunks=True,
    )

    # F-order 3D
    path = os.path.join(FIXTURES_FOLDER, "simple_F_3D.zarr")
    create_simple_array(
        store=path,
        dtype="<i4",
        compression=None,
        order="F",
        ndim=3,
        write_chunks=True,
    )

    # nested
    store = zarr.storage.FSStore(
        os.path.join(FIXTURES_FOLDER, "simple_nested.zarr"),
        key_separator="/",
        auto_mkdir=True,
    )
    create_simple_array(
        store=store,
        dtype=">i4",
        compression="blosc",
        write_chunks=True,
        dimension_separator="/",
    )

    # Float 16
    path = os.path.join(FIXTURES_FOLDER, "simple_float16_LE.zarr")
    create_simple_array(
        store=path, dtype="<f2", compression="blosc", write_chunks=True
    )

    path = os.path.join(FIXTURES_FOLDER, "simple_float16_BE.zarr")
    create_simple_array(
        store=path, dtype=">f2", compression="blosc", write_chunks=True
    )


if __name__ == "__main__":
    generate_fixtures()
