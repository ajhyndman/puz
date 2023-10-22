import { Buffer } from 'buffer';

// supported text encodings
export enum ENCODING {
  UTF_8 = 'utf-8',
  ISO_8859_1 = 'latin1',
}

export const enum HEADER_OFFSET {
  FILE_CHECKSUM_START = 0x00,
  FILE_SIGNATURE_START = 0x02,
  FILE_SIGNATURE_END = 0x0e,
  HEADER_CHECKSUM_START = 0x0e,
  HEADER_END = 0x34,
  ICHEATED_CHECKSUM_START = 0x10,
  ICHEATED_CHECKSUM_END = 0x18,
  VERSION_START = 0x18,
  VERSION_END = 0x1c,
  RESERVED_1C_START = 0x1c,
  SCRAMBLED_CHECKSUM_START = 0x1e,
  RESERVED_20_START = 0x20,
  RESERVED_20_END = 0x2c,
  WIDTH_START = 0x2c,
  HEIGHT_START = 0x2d,
  NUMBER_OF_CLUES_START = 0x2e,
  UNKNOWN_BITMASK_START = 0x30,
  SCRAMBLED_START = 0x32,
}

export enum SQUARE_MARKUP_BITMASK {
  CIRCLED = 0x80,
  REVEALED = 0x40,
  INCORRECT = 0x20,
  PREVIOUSLY_INCORRECT = 0x10,
  UNKNOWN_08 = 0x08,
  UNKNOWN_04 = 0x04,
  UNKNOWN_02 = 0x02,
  UNKNOWN_01 = 0x01,
}

export const enum EXTENSION {
  MARKUP_GRID = 'GEXT',
  REBUS_GRID = 'GRBS',
  REBUS_SOLUTION = 'RTBL',
  REBUS_STATE = 'RUSR',
  TIMER = 'LTIM',
}

export const squareMarkupKeys = [
  'circled',
  'incorrect',
  'previouslyIncorrect',
  'revealed',
  'unknown_08',
  'unknown_04',
  'unknown_02',
  'unknown_01',
] as const;

export type SquareMarkupKey = typeof squareMarkupKeys[number];

export const CHAR_CODE_A = 'A'.charCodeAt(0);
export const EMPTY_BUFFER = Buffer.from([]);
export const NULL_BYTE = Buffer.from([0x00]);
export const ICHEATED = Buffer.from('ICHEATED', 'ascii');

export const FILE_SIGNATURE = 'ACROSS&DOWN\x00';

export const REGEX_BLACK_SQUARE = /[.:]/;
export const REGEX_REBUS_TABLE_STRING = /^([ 0-9]\d:[a-zA-Z0-9@#$%&+?]*?;)*$/;
export const REGEX_TIMER_STRING = /^(\d+),([01])$/;
export const REGEX_VERSION_STRING = /^(\d+)\.(\d+)([a-z])?$/;
export const REGEX_SOLUTION = /^[.:A-Za-z0-9@#$%&+?]+$/;
export const REGEX_STATE = /^[-.:A-Za-z0-9@#$%&+?]+$/;
export const REGEX_UPPERCASE_ALPHA = /^[A-Z]$/;

export const DEFAULT_FILE_VERSION = '1.4';
