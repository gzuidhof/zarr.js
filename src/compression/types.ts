export abstract class Codec {
    static codecId: string
    abstract encode(buf: Buffer | ArrayBuffer): Buffer | ArrayBuffer
    abstract decode(buf: Buffer | ArrayBuffer, out?: Buffer): Buffer | ArrayBuffer
}
