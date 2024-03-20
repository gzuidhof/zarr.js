# Changelog

## Release 0.6.3
**Date:** 2024-03-20

* Fix error passthrough in queued tasks.

## Release 0.6.2
**Date:** 2023-10-09

* Added store get options pass through to `ZarrArray.get` and `ZarrArray.getRaw`.

## Release 0.6.1
**Date:** 2023-02-01

* Added support for `|b1` data type.

## Release 0.6.0
**Date:** 2022-09-12

* Add (optional) support for `f2` data types (see: https://guido.io/zarr.js/#/advanced/float16).

## Release 0.5.2
**Date:** 2022-07-15

* Fix unreachable code paths due to always `false` `Array === []` comparison when checking empty selection.
* Use `URL`-based path resolution in `HTTPStore`. Allows for forwarding of `URL.searchParams` if specified.
* Added read-only support for `F`-ordered zarr arrays.

## Release 0.5.1
**Date:** 2021-07-19

* Update `numcodecs` types to latest release.
* Fix `zarr/core` esm package export. Don't minify internal names for module export.

## Release 0.5.0
**Date:** 2021-04-22

* Support `dimension_separator` to `.zarray` metadata: https://github.com/zarr-developers/zarr-python/pull/715
* Add better error messages for unsupported `dtype`.
* Migrate to GitHub Actions from Travis CI.
* Add `ZarrError` interface to support custom errors. Removes `zarr.js` as dependency for valid custom stores.
* Update `numcodecs` to `v0.2.0`.

## Release 0.4.0
**Date:** 2021-02-03

* Fix UMD url in `package.json`.
* Avoid unnecessary requests for `openArray` and `openGroup` methods. Prevents anticipated 404s in `HTTPStore`.
* Add `getOptions` to `ZarrArray.getRawChunk` (options to pass down to underlying store).
* Remove ts-interface checking, add stats HTML, export modern target. Slim down `zarr.js`.

## Release 0.3.1
**Date:** 2020-10-23

* Rethrow existing errors in `try`/`catch` blocks (bug fix).
* Add `zarr/core` package export (entry-point does not bundle `numcodecs`).
* Add `fetchOptions` and `supportedMethods` to `HTTPStore`.
* Use `TextDecoder` to decode metadata store.

## Release 0.3.0
**Date:** 2020-03-31

* Add `numcodecs` as dependency with `blosc` support.
* Handle `dtype` endianness.
* Rethrow `BoundsCheckError` with more descriptive message in `ZarrArray.getRawChunk`.

## Release 0.2.3
**Date:** 2020-03-03

* Fix path concat in `HTTPSTore`. Use simple string concat rather than `URL`-based resolution.
* Throw `KeyError` on 404 in `HTTPStore` to remove duplicate requests.
* Add `ZarrArray.getRawChunk` to directly fetch and decode chunk from Store.

## Release 0.2.0
**Date:** 2020-02-11

* Add `RawArray` (strided TypedArray) class and `ZarrArray.getRaw` method.
* Add async indexing with concurrency limit (and process callback) for `ZarrArray.get`.
* Add async setter with concurrency limit.
* Allow more data types (32 & 16 bit unsigned and signed integers).
