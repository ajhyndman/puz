import { readFileSync } from 'fs';
import { join } from 'path';

import { parseBinaryFile, printBinaryFile, printTextFile } from '../src/index';

describe('puz', () => {
  const puzzleFiles = [
    'av110622.puz',
    'cs080904.puz',
    'Feb0308_oddnumbering.puz',
    'nyt_diagramless.puz',
    'nyt_locked.puz',
    'nyt_partlyfilled.puz',
    'nyt_rebus_with_notes_and_shape.puz',
    'nyt_sun_rebus.puz',
    'nyt_v1_4.puz',
    'nyt_weekday_with_notes.puz',
    'nyt_with_shape.puz',
    'unicode.puz',
    'unicode_with_state.puz',
    'washpost.puz',
    'wsj110624.puz',
  ].map((path) => [path, readFileSync(join(__dirname, 'puzzles', path))] as const);

  describe('parseBinaryFile', () => {
    it.each(puzzleFiles)('parses "%s" without crashing', (path, buffer) => {
      parseBinaryFile(buffer);
    });

    it.each(puzzleFiles)('extracts expected Puzzle object from "%s"', (path, buffer) => {
      expect(parseBinaryFile(buffer)).toMatchSnapshot();
    });
  });

  describe('printBinaryFile', () => {
    it.each(puzzleFiles)('prints "%s" preserving exact bytes', (path, buffer) => {
      const puzzle = parseBinaryFile(buffer);
      expect(printBinaryFile(puzzle)).toEqual(buffer);
    });
  });

  describe('parseBinaryFile and printTextFile', () => {
    it.each(puzzleFiles)('together print "%s" to expected text', (path, buffer) => {
      const puzzle = parseBinaryFile(buffer);
      expect(printTextFile(puzzle)).toMatchSnapshot();
    });
  });
});
