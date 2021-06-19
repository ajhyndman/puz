import { readFileSync } from 'fs';
import { join } from 'path';

import { parseBinaryFile, printBinaryFile } from '../src/index';

describe('puz', () => {
  const puzzleFiles = [
    './puzzles/av110622.puz',
    './puzzles/cs080904.puz',
    './puzzles/washpost.puz',
  ].map((path) => readFileSync(join(__dirname, path)));

  it('parses binary puzzles without crashing', () => {
    puzzleFiles.forEach((buffer) => {
      parseBinaryFile(buffer);
    });
  });

  it('parses and prints binary files preserving exact bytes', () => {
    puzzleFiles.forEach((buffer) => {
      const puzzle = parseBinaryFile(buffer);
      expect(printBinaryFile(puzzle)).toEqual(buffer);
    });
  });
});
