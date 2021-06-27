import { ENCODING } from './constants';

/**
 * A cursor-based readeer that provides methods useful for reading strings from
 * puzzle binary data.
 */
export class StringReader {
  private buffer: Buffer;
  private encoding: ENCODING;
  private cursor: number;

  constructor(buffer: Buffer, encoding: ENCODING, initialCursor?: number) {
    this.buffer = buffer;
    this.encoding = encoding;
    this.cursor = initialCursor ?? 0;
  }

  /**
   * Read "length" butes from the current cursor position.  Updates cursor to
   * the first unread byte.
   *
   * @param length The number of bytes to be read.
   * @returns
   * The string that results from decoding the target bytes.
   *
   * If length specified is zero, returns undefined.
   */
  read(length: number): string | undefined {
    const end = this.cursor + length;
    if (length <= 0) {
      return undefined;
    }
    const decodedString = this.buffer.toString(this.encoding, this.cursor, end);
    this.cursor = end;
    return decodedString;
  }

  /**
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
    const nextNullByte = this.buffer.indexOf(0x0, this.cursor);
    const end = nextNullByte === -1 ? this.buffer.length - 1 : nextNullByte;
    const length = end - this.cursor;
    const decodedString = this.read(length);
    this.cursor += 1;
    return decodedString;
  }
}
