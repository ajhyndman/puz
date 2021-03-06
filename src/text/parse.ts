import invariant from 'ts-invariant';
import { Puzzle } from '..';
import { mergeClues } from '../util/misc';
import { rebusKeyCharToNum } from '../util/rebusKey';
import { validate } from '../validate';

enum SECTION {
  TITLE = 'TITLE',
  AUTHOR = 'AUTHOR',
  COPYRIGHT = 'COPYRIGHT',
  SIZE = 'SIZE',
  GRID = 'GRID',
  ACROSS = 'ACROSS',
  DOWN = 'DOWN',
  NOTEPAD = 'NOTEPAD',
  REBUS = 'REBUS',
}

const enum FILE_VERSION {
  V1,
  V2,
}

const SIGNATURE_V1 = /^\s*\<ACROSS PUZZLE\>\s*$/;
const SIGNATURE_V2 = /^\s*\<ACROSS PUZZLE V2\>\s*$/;

const SECTION_TAG = /^\s*\<(TITLE|AUTHOR|COPYRIGHT|SIZE|GRID|ACROSS|DOWN|NOTEPAD|REBUS)\>\s*$/;
const SOLUTION_CONTENT_V1 = /^[A-Z.:]+/;
const SOLUTION_CONTENT_V2 = /^[A-Za-z0-9@#$%&+?.:]+$/;
const SIZE_CONTENT = /^(\d+)x(\d+)$/;
const LINE_BREAK = /\r\n|\n/; // match Windows or Unix line endings
const LOWER_ALPHA = /[a-z]/;
const REBUS_MARK = /^MARK;$/i;
const REBUS_SUBSTITUTION = /^([A-Za-z0-9@#$%&+?]):([A-Z]+|\[\d+\]):([A-Za-z0-9@#$%&+?])$/;

function assertSingleLineSection(tagName: string, sectionLines: string[]) {
  invariant(
    sectionLines.length === 1,
    `<${tagName}> section expects exactly one line. Found ${sectionLines.length} lines.`,
  );
}

export function parseTextFile(file: string): Puzzle {
  const lines = file.split(LINE_BREAK).filter((line) => line !== '');

  // VALIDATE THAT FILE SIGNATURE IS PRESENT
  const hasV1Signature = SIGNATURE_V1.test(lines[0]);
  const hasV2Signature = SIGNATURE_V2.test(lines[0]);
  invariant(
    hasV1Signature || hasV2Signature,
    'File does not appear to be an Across Lite puzzle description',
  );

  // DETERMINE VILE VERSION
  const fileVersion = hasV1Signature ? FILE_VERSION.V1 : FILE_VERSION.V2;

  // VALIDATE THAT REQUIRED FILE SECTIONS ARE PRESENT
  const requiredTags = [
    SECTION.TITLE,
    SECTION.AUTHOR,
    SECTION.COPYRIGHT,
    SECTION.SIZE,
    SECTION.GRID,
    SECTION.ACROSS,
    SECTION.DOWN,
  ];
  requiredTags.forEach((tag) => {
    const isTagPresent = lines.some((line) => new RegExp(`^\\s*\\<${tag}\\>\\s*$`).test(line));
    invariant(isTagPresent, `File is missing required tag: <${tag}>`);
  });

  const puzzle: Partial<Puzzle> = {};

  let across: string[];
  let down: string[];

  // READ SECTIONS UNTIL FILE COMPLETE
  const unreadLineQueue = lines.slice(1);
  while (unreadLineQueue.length > 0) {
    // read section
    const sectionTag = unreadLineQueue.shift()!;
    invariant(
      SECTION_TAG.test(sectionTag),
      `Couldn't parse file.  Expected section tag, but got: "${sectionTag}"`,
    );
    const [, sectionName] = SECTION_TAG.exec(sectionTag)!;

    const sectionLines: string[] = [];
    while (unreadLineQueue.length > 0 && !SECTION_TAG.test(unreadLineQueue[0])) {
      const line = unreadLineQueue.shift()!;
      sectionLines.push(line);
    }

    switch (sectionName) {
      case SECTION.TITLE: {
        assertSingleLineSection(sectionName, sectionLines);
        puzzle.title = sectionLines[0].trim();
        break;
      }
      case SECTION.AUTHOR: {
        assertSingleLineSection(sectionName, sectionLines);
        puzzle.author = sectionLines[0].trim();
        break;
      }
      case SECTION.COPYRIGHT: {
        assertSingleLineSection(sectionName, sectionLines);
        puzzle.copyright = sectionLines[0].trim();
        break;
      }
      case SECTION.SIZE: {
        assertSingleLineSection(sectionName, sectionLines);
        const sizeString = sectionLines[0].trim();
        invariant(
          SIZE_CONTENT.test(sizeString),
          `Puzzle size expected in the format "WIDTHxHEIGHT" (e.g. "15x15"). Received: "${sizeString}"`,
        );
        const [, width, height] = SIZE_CONTENT.exec(sizeString)!;
        puzzle.width = Number.parseInt(width);
        puzzle.height = Number.parseInt(height);
        break;
      }
      case SECTION.GRID: {
        const trimmedLines = sectionLines.map((line) => line.trim());
        const permittedSolutionContent =
          fileVersion === FILE_VERSION.V2 ? SOLUTION_CONTENT_V2 : SOLUTION_CONTENT_V1;
        invariant(
          trimmedLines.every((line) => permittedSolutionContent.test(line)),
          '<GRID> section contains unsupported characters.',
        );
        puzzle.solution = trimmedLines.join('');
        break;
      }
      case SECTION.ACROSS: {
        across = sectionLines.map((line) => line.trim());
        break;
      }
      case SECTION.DOWN: {
        down = sectionLines.map((line) => line.trim());
        break;
      }
      case SECTION.NOTEPAD: {
        // preserve white space, but standardize line breaks
        puzzle.notepad = sectionLines.join('\n');
        break;
      }
      case SECTION.REBUS: {
        invariant(
          fileVersion !== FILE_VERSION.V1,
          'The <REBUS> tag is not supported in V1 text files.  Consider using the <ACROSS PUZZLE V2> file tag',
        );

        let solution = puzzle.solution!;
        invariant(
          solution != null,
          'The <REBUS> tag is expected to come after <GRID> in puzzle descriptions',
        );

        const rebusGrid: (number | undefined)[] = new Array(solution.length);
        const rebusSolution: { [key: number]: string } = {};

        sectionLines
          .map((line) => line.trim())
          .forEach((line) => {
            // handle MARK; annotation
            if (REBUS_MARK.test(line) && puzzle.markupGrid == null) {
              const markupGrid = [...solution].map((character) => {
                if (LOWER_ALPHA.test(character)) {
                  return { circled: true };
                }
                return {};
              });

              if (markupGrid.some(({ circled }) => circled)) {
                puzzle.markupGrid = markupGrid;
              }
            }

            // handle substitution annotations (in the format "1:ABC:A")
            if (REBUS_SUBSTITUTION.test(line)) {
              const [, charKey, substitution, fallback] = REBUS_SUBSTITUTION.exec(line)!;
              const numKey = rebusKeyCharToNum(charKey);

              // populate rebus grid
              [...solution].forEach((square, i) => {
                if (square === charKey) {
                  rebusGrid[i] = numKey;
                }
              });

              // populate solution table
              rebusSolution[numKey] = substitution;

              // replace solution placeholders with fallback solution
              solution = solution.replaceAll(charKey, fallback);
            }
          });

        if (Object.keys(rebusSolution).length > 0) {
          puzzle.solution = solution;
          puzzle.rebus = {
            grid: rebusGrid,
            solution: rebusSolution,
          };
        }

        break;
      }
      default: {
        throw new Error(`Unhandled section tag: ${sectionTag}`);
      }
    }
  }

  // normalize final puzzle solution to uppercase
  puzzle.solution = puzzle.solution?.toUpperCase();

  const { width, solution } = puzzle;
  if (width != null && solution != null && across! != null && down! != null) {
    puzzle.clues = mergeClues({ width, solution }, across, down);
  }

  validate(puzzle);

  return puzzle;
}
