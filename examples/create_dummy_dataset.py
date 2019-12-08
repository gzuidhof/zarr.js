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
