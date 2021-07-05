import { readFileSync } from 'fs';
import { join } from 'path';

import { parseTextFile, printTextFile } from '../src/index';

describe('puz', () => {
  const puzzleFiles = [
    'v1_text_format.txt',
    'v2_text_format_mark.txt',
    'v2_text_format_rebus.txt',
  ].map(
    (path) => [path, readFileSync(join(__dirname, 'puzzles', path))] as const,
  );

  describe('parseTextFile', () => {
    it('throws if file signature is not present', () => {
      expect(() => parseTextFile('')).toThrowError(
        'File does not appear to be an Across Lite puzzle description',
      );
    });

    it('throws if not all required tags are present', () => {
      expect(() => parseTextFile('<ACROSS PUZZLE>')).toThrowError(
        'File is missing required tag: <TITLE>',
      );
      expect(() => parseTextFile('<ACROSS PUZZLE V2>')).toThrowError(
        'File is missing required tag: <TITLE>',
      );
      expect(() =>
        parseTextFile(`<ACROSS PUZZLE>
        <TITLE>
        <AUTHOR>
        <COPYRIGHT>
        <SIZE>
        <GRID>
        <DOWN>
      `),
      ).toThrowError('File is missing required tag: <ACROSS>');
      expect(() => parseTextFile('<ACROSS PUZZLE V2>')).toThrowError(
        'File is missing required tag: <TITLE>',
      );
    });

    it.each(puzzleFiles)('parses "%s" without crashing', (path, buffer) => {
      parseTextFile(buffer.toString('utf-8'));
    });

    it.each(puzzleFiles)(
      'extracts expected Puzzle object from "%s"',
      (path, buffer) => {
        expect(parseTextFile(buffer.toString('utf-8'))).toMatchSnapshot();
      },
    );
  });

  describe('printTextFiles', () => {
    it.each(puzzleFiles)(
      'prints "%s" back to expected V2 file',
      (path, buffer) => {
        const puzzle = parseTextFile(buffer.toString('utf-8'));
        expect(printTextFile(puzzle)).toMatchSnapshot();
      },
    );
  });
});
