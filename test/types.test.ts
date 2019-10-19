import { readFileSync } from "fs";
import * as path from "path";
import { createCheckers } from "ts-interface-checker";
import * as NAMES from "../src/names";
import typesTI from "../src/types-ti";

const FIXTURES_FOLDER = path.resolve(__dirname, `../fixtures`);
const { ZarrArrayMetadata } = createCheckers(typesTI);

describe("ZarrArrayMetadata Typings", () => {
    const metadataPath = path.join(FIXTURES_FOLDER, `empty.zarr/${NAMES.ARRAY_META_KEY}`);
    const simpleMetadata = JSON.parse(readFileSync(metadataPath, { encoding: "utf8" }));

    it("Simple ZarrArrayMetadata is valid", () => {
        expect(ZarrArrayMetadata.test(simpleMetadata)).toBeTruthy();
    });
});
