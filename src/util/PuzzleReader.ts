import { ENCODING } from './constants';

/**
 * A cursor-based readeer that provides methods useful for reading strings and
 * bytes from PUZ file binary data.
 */
export class PuzzleReader {
  private buffer: Buffer;
  private encoding: ENCODING;

  public cursor: number;

  constructor(buffer: Buffer, encoding: ENCODING, initialCursor?: number) {
    this.buffer = buffer;
    this.encoding = encoding;
    this.cursor = initialCursor ?? 0;
  }

  private _getNextNullByte() {
    const nextNullByte = this.buffer.indexOf(0x00, this.cursor);
    return nextNullByte === -1 ? this.buffer.length - 1 : nextNullByte;
  }

  hasBytesToRead() {
    return this.cursor < this.buffer.length;
  }

  /**
   * Decodes bytes as a string using the specified encoding.
   *
   * Read "length" butes from the current cursor position.  Updates cursor to
   * the first unread byte.
   *
   * @param length The number of bytes to be read.
   * @returns
   * The string that results from decoding the target bytes.
   *
   * If length specified is zero, returns undefined.
   */
  readString(length: number): string | undefined {
    const end = this.cursor + length;
    if (length <= 0) {
      return undefined;
    }
    const decodedString = this.buffer.toString(this.encoding, this.cursor, end);
    this.cursor = end;
    return decodedString;
  }

  /**
   * Decodes bytes as a string using the specified encoding.
   *
   * Reads all bytes from the current cursor position until the next null
   * character.  Omits the null character.  Updates cursor to the byte
   * *following* the null character.
   *
   * If there is no remaining null character, reads to the end of the string.
   *
   * @returns The string that results from decoding the target bytes.
   *
   * If no null bytes remain, reads to the end of the string.
   *
   * If there are no bytes between the cursor and the next null byte (or EOF),
   * returns undefined.
   */
  readNullTerminatedString(): string | undefined {
    const end = this._getNextNullByte();
    const length = end - this.cursor;
    const decodedString = this.readString(length);
    this.cursor += 1;
    return decodedString;
  }

  /**
   * Read bytes into a new buffer.
   *
   * Read "length" butes from the current cursor position.  Updates cursor to
   * the first unread byte.
   *
   * @param length
   * @returns The target bytes in a new Buffer instance.
   */
  readBytes(length: number): Buffer | undefined {
    const end = this.cursor + length;
    if (length <= 0) {
      return undefined;
    }
    const byteArray = this.buffer.subarray(this.cursor, end);
    this.cursor = end;
    return byteArray;
  }

  /**
   * Read bytes into a new buffer.
   *
   * Reads all bytes from the current cursor position until the next null
   * character.  Omits the null character.  Updates cursor to the byte
   * *following* the null character.
   *
   * @returns The target bytes in a new Buffer instance.
   *
   * If no null bytes remain, reads to the end of the string.
   *
   * If there are no bytes between the cursor and the next null byte (or EOF),
   * returns undefined.
   */
  readNullTerminatedBytes(): Buffer | undefined {
    const end = this._getNextNullByte();
    const length = end - this.cursor;
    const byteArray = this.readBytes(length);
    this.cursor += 1;
    return byteArray;
  }
}
