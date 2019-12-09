import zarr
import os

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

    for codec, filename_postfix in ([None, ""], ["gzip", "_gzip"], ["zlib", "_zlib"]):
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


if __name__ == "__main__":
    generate_fixtures()
