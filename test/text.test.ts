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
});
