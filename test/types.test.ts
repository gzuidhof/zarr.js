import * as NAMES from "../src/names";
import * as fs from "fs";
import * as path from "path";

import typesTI from "../src/types-ti";
import { createCheckers } from "ts-interface-checker";
const { ZarrMetadata } = createCheckers(typesTI);

const FIXTURES_FOLDER = path.resolve(__dirname, `../fixtures`)

describe("ZarrMetadata Typings", () => {

    const metadataPath = path.join(FIXTURES_FOLDER, `empty.zarr/${NAMES.METADATA_FILENAME}`)
    const simpleMetadata = JSON.parse(fs.readFileSync(metadataPath, { encoding: "utf8" }));

    it("Simple ZarrMetadata is valid", () => {
        expect(ZarrMetadata.check(simpleMetadata)).toBeUndefined();
    })
})
