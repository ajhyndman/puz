import { Puzzle } from '..';

enum SECTION {
  TITLE = 'TITLE',
  AUTHOR = 'AUTHOR',
  COPYRIGHT = 'COPYRIGHT',
  SIZE = 'SIZE',
  GRID = 'GRID',
  ACROSS = 'ACROSS',
  DOWN = 'DOWN',
  NOTEPAD = 'NOTEPAD',
}

const TEXT_FILE_SIGNATURE = /^\s*\<ACROSS PUZZLE\>\s*$/;
const TEXT_FILE_SIGNATURE_V2 = /^\s*\<ACROSS PUZZLE V2\>\s*$/;

const TEXT_FILE_SECTION_TITLE =
  /^\s*\<(TITLE|AUTHOR|COPYRIGHT|SIZE|GRID|REBUS|ACROSS|DOWN|NOTEPAD)\>\s*$/;

export function parseTextFile(file: string): Puzzle {
  // validate that file signature present

  // determine file version

  // validate that all required sections are present

  // read lines until file complete
  return {};
}
