import { SquareMarkupKey } from './util/constants';

export type SquareMarkup = {
  [key in SquareMarkupKey]?: boolean;
};

export type Puzzle = {
  // meta
  author?: string;
  copyright?: string;
  fileVersion?: string;
  height: number;
  isScrambled?: boolean;
  notepad?: string;
  title?: string;
  width: number;

  // grid data
  solution: string;
  state?: string;

  // clues
  clues: string[];

  // extension data
  rebus?: {
    grid?: (number | undefined)[];
    solution?: { [key: number]: string };
    state?: (string | undefined)[];
  };
  markupGrid?: SquareMarkup[];
  timer?: {
    secondsElapsed: number;
    isPaused: boolean;
  };

  // misc
  misc?: {
    unknown1?: number;
    unknown2?: Uint8Array;
    unknown3?: number;
    preamble?: Uint8Array;
    scrambledChecksum?: number;
  };
};

export { parseBinaryFile } from './binary/parse';
export { printBinaryFile } from './binary/print';

export { parseTextFile } from './text/parse';
export { printTextFile } from './text/print';

export { validate } from './validate';
