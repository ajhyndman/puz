export type Puzzle = {
  // meta
  author: string;
  copyright: string;
  description: string;
  fileVersion: string;
  height: number;
  isScrambled: boolean;
  notePad: string;
  numberOfClues: number;
  theme: string;
  title: string;
  width: number;

  // grid data
  solution: string;
  state: string;

  // clues
  clues: string[];
};

export declare function parseBinaryFile(file: Buffer): Puzzle;

export declare function printBinaryFile(puzzle: Puzzle): Buffer;

export declare function parseTextFile(file: string): Puzzle;

export declare function printTextFile(puzzle: Puzzle): string;
