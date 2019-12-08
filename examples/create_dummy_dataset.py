import numpy as np
import zarr

z = zarr.open("dummy_dataset.zarr", shape=(3, 1000), chunks=(1, 1000), compressor=None, dtype=np.float32)

z[0] = np.arange(1000)
z[1] = np.sin(np.arange(1000)/100)
z[2] = np.random.rand(1000)


print(z[0, :20])
print(z[1, :20])
print(z[2, :20])
