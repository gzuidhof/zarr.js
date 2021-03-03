![Zarr.js Logo](docs/logo.png)

[![Actions Status](https://github.com/gzuidhof/zarr.js/actions/workflows/test.yml/badge.svg)](https://github.com/gzuidhof/zarr.js/actions)
![Top Language Badge](https://img.shields.io/github/languages/top/gzuidhof/zarr.js)
[![NPM badge](https://img.shields.io/npm/v/zarr)](https://www.npmjs.com/package/zarr)
[![Documentation](https://img.shields.io/badge/Read%20the-documentation-1abc9c.svg)](http://guido.io/zarr.js)

---
Typescript implementation of [**Zarr**](https://zarr.readthedocs.io/en/stable/).
> Zarr is a library for chunked, compressed, N-dimensional arrays.

## Quick start

```
npm i zarr
```

See the Getting Started section in the [**Documentation**](http://guido.io/zarr.js).

### Type Docs
You can generate the type documentation for this project by running `npm run generate-typedocs`.

## Why a Typescript implementation for Zarr?
For better or for worse the browser environment is slowly becoming the world's operating system. Numerical computing with a lot of data is a poor fit for browsers, but for data visualization, exploration and result-sharing the browser is unparalleled.

With this library a workflow as such becomes possible:
* You run an experiment/workflow in Python or Julia.
* You write results to a Zarr store, perhaps one that lives in some cloud storage.
* In a browser you create a visualization suite which allows for some interactivity.
* You share a link to a colleague or friend.
