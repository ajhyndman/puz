/* scramble.c: Copyright 2008 by Brian Raiter <breadbox@muppetlabs.com>.
 * This source code is licensed under the Creative Commons CC0 license
 * <http://creativecommons.org/publicdomain/zero/1.0/legalcode>.
 * Copying and distribution of this file, with or without
 * modification, are permitted in any medium without royalty. This
 * file is offered as-is, without any warranty.
 *
 * Usage: scramble [KEY] FILENAME
 *
 * FILENAME will be scrambled with the given key if it is unscrambled,
 * or unscrambled with the given key if it is scrambled. If KEY is
 * omitted, a key is automatically generated. (This is unlikely to
 * accomplish much if one is trying to unscramble.) Note that the file
 * is always modified in place.
 *
 * Here is a high-level overview of the scrambling algorithm:
 *
 * 1. The letters are copied from the solution into a buffer. The
 *    solution is read column-wise, i.e. going from top to bottom, then
 *    from left to right. Black squares are skipped over, so that the
 *    buffer contains only letters A through Z.
 *
 * 2. A checksum is calculated for this buffer at this point and stored
 *    in the header.
 *
 * 3. The letters in the buffer are replaced with numbers in the range
 *    0 to 25, inclusive (with A becoming 0, B becoming 1, etc).
 *
 * 4. The buffer contents are then arranged into a (notional) table 16
 *    columns wide. The table is filled column-wise, but starting with
 *    the rightmost column (i.e. going from top to bottom, then right
 *    to left).
 *
 * 5. Successive digits of the key are added to the letters (mod 26),
 *    one digit per letter, moving column-wise through the table. Rows
 *    are then shifted from the top of the table to the end, the
 *    number of rows being equal to the first digit of the key. If the
 *    number of letters in the buffer is even, then each row shifted
 *    is also individually rotated right, with the rightmost cell
 *    shifting around to the leftmost.
 *
 * 6. The notional table is changed from 16 columns to 8 columns
 *    (without actually altering the buffer contents), and step 5 is
 *    then repeated, with the second digit of the key being used
 *    instead of the first in the row shift.
 *
 * 7. Step 5 is repeated two more times, with a 4-column table and then
 *    a 2-column table, and with the remaining two digits of the key
 *    controlling the row shift.
 *
 * 8. The numbers in the buffer are turned back into letters.
 *
 * 9. The buffer is copied back into the solution, in the same order in
 *    which it was originally copied out (top to bottom, left to right,
 *    skipping over black squares).
 *
 * Here is a pseudocode representation of steps 4 through 7:
 *
 *   tmp[0..size] = buffer[0..size]
 *   j = -1
 *   for i = 0..size
 *       j += 16
 *       j -= size | 1 until j < size
 *       buffer[j] = tmp[i]
 *   for k = 0..4
 *       n = 2**(4-k)
 *       j = -1
 *       for i = 0..size
 *           j += n
 *           j -= size | 1 until j < size
 *           buffer[j] = (buffer[j] + key[i%4]) % 26
 *       n -= size | 1 if n > size
 *       for i = 0..key[k]
 *           rotate buffer[0..n], +1 if size % 2 == 0
 *           rotate buffer[0..size], -n
 *
 * The unscrambling algorithm is essentially the reverse of the above.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <time.h>
#include <errno.h>

/* It's assumed that every square in the fill that isn't a letter
 * between A and Z must be a black square (i.e. either '.' or ':').
 */
#define isletter(ch) ((ch) >= 'A' && (ch) <= 'Z')

/* These typedefs are mainly here to avoid having to type "unsigned".
 */
typedef unsigned char byte;
typedef unsigned short cksum;

/* The maximum grid dimensions permitted by the Across Lite program.
 */
static int const maxwidth = 39;
static int const maxheight = 39;
#define MAXGRIDSIZE (39 * 39)

/* Details of the file format.
 */
static char const ident[] = "ACROSS&DOWN";
static int const scrambleflag = 4;
static int const identpos = 2;
static int const checksumpos = 30;
static int const specpos = 44;
static int const dimensionpos = 44;
static int const cluecountpos = 46;
static int const bitflagpos = 50;
static int const speclength = 8;
static int const dryRun = 1;
#define HEADERSIZE 52

/* Information about a given puzzle used by this program.
 */
struct puzzle {
    int     width;		/* the width of the grid */
    int     height;		/* the height of the grid */
    int     scrambled;		/* non-zero if the puzzle is scrambled */
    int     fillchecksum;	/* the checksum of the unscrambled solution */
    char   *filename;		/* the puzzle file (for error messages) */
    byte    header[HEADERSIZE];	/* the file header */
    byte    fill[MAXGRIDSIZE];	/* the solution (aka fill) */
};


static void print_puzzle_fields(struct puzzle puz) {
    printf("width [%d]\n", puz.width);
    printf("height [%d]\n", puz.height);
    printf("scrambled [%d]\n", puz.scrambled);
    printf("fillchecksum [%d]\n", puz.fillchecksum);
    printf("filename [%s]\n", puz.filename);
}

/*
 * General-purpose functions.
 */

/* Print an error message and exit with a failure code.
 */
static void die(char const *fmt, ...)
{
    va_list args;

    fputs("scramble: ", stderr);
    va_start(args, fmt);
    vfprintf(stderr, fmt, args);
    va_end(args);
    fputc('\n', stderr);
    exit(EXIT_FAILURE);
}

/* Report an error using errno.
 */
static void fail(char const *prefix)
{
    die("%s: %s", prefix, errno ? strerror(errno) : "unexpected EOF");
}

/* Same as fail(), but warn about file corruption.
 */
static void badfail(char const *prefix)
{
    die("%s: %s\nNOTE: error occured after the file was partially modified!",
	prefix, strerror(errno));
}

/*
 * File I/O functions.
 */

/* Compute the (running) checksum for a given buffer.
 */
static cksum getchecksum(byte const *buffer, int size, cksum sum)
{
    int n;

    for (n = 0 ; n < size ; ++n) {
	sum = (sum >> 1) | ((sum & 1) << 15);
	sum += buffer[n];
    }
    return sum;
}

/* Examine the input file and pick out the scrambling-specific data.
 */
static void readsrcfile(FILE *fp, struct puzzle *p)
{
    rewind(fp);
    // fetch 52 bytes forom top of file descriptor
    if (fread(p->header, sizeof p->header, 1, fp) != 1)
	fail(p->filename);
    if (memcmp(p->header + identpos, ident, sizeof ident))
	die("%s: not a valid puz file", p->filename);
    p->width = p->header[dimensionpos];
    p->height = p->header[dimensionpos + 1];
    if (p->width < 1 || p->width > maxwidth)
	die("%s: width of %d is invalid", p->filename, p->width);
    if (p->height < 1 || p->height > maxheight)
	die("%s: height of %d is invalid", p->filename, p->height);
    p->scrambled = p->header[bitflagpos] & scrambleflag;
    p->fillchecksum = p->header[checksumpos] |
			(p->header[checksumpos + 1] << 8);
    if (fread(p->fill, p->width * p->height, 1, fp) != 1)
	fail(p->filename);
}

/* Change the header data to reflect the puzzle's current status with
 * respect to being scrambled or not. This also means updating several
 * of the checksum fields to match the new file contents. Since these
 * checksums aren't otherwise relevant to the scrambling algorithm,
 * they aren't explained here. Check the file format specification for
 * details if you're curious.
 */
static void updateheader(struct puzzle *p)
{
    unsigned short checksum;

    if (p->scrambled) {
	p->header[bitflagpos] |= scrambleflag;
	p->header[checksumpos] = p->fillchecksum & 0xFF;
	p->header[checksumpos + 1] = (p->fillchecksum >> 8) & 0xFF;
    } else {
	p->header[bitflagpos] &= ~scrambleflag;
	p->header[checksumpos] = 0;
	p->header[checksumpos + 1] = 0;
    }

    checksum = getchecksum(p->header + specpos, speclength, 0);
    p->header[14] = checksum & 0xFF;
    p->header[15] = (checksum >> 8) & 0xFF;
    p->header[16] = 'I' ^ (checksum & 0xFF);
    p->header[20] = 'A' ^ ((checksum >> 8) & 0xFF);
    checksum = getchecksum(p->fill, p->width * p->height, 0);
    p->header[17] = 'C' ^ (checksum & 0xFF);
    p->header[21] = 'T' ^ ((checksum >> 8) & 0xFF);
}

/* Recalculate the overall file checksum to match the file's current
 * contents. It should be called after the rest of the file has been
 * updated. As with the previous function, the details of this process
 * aren't explained here. Check the file format specification if you
 * wish to know more.
 */
static void writefilechecksum(FILE *fp, struct puzzle const *p)
{
    cksum checksum;
    byte *buf, *ptr;
    long size;
    int stringcount, len, i, n;

    if (fseek(fp, 0, SEEK_END) < 0)
	badfail(p->filename);
    size = ftell(fp);
    if (size < 0 || fseek(fp, specpos, SEEK_SET) < 0)
	badfail(p->filename);
    size -= specpos;
    buf = malloc(size);
    if (!buf)
	badfail(p->filename);
    if (fread(buf, size, 1, fp) != 1)
	badfail(p->filename);

    n = speclength + p->width * p->height * 2;
    checksum = getchecksum(buf, n, 0);
    ptr = buf + n;
    stringcount = p->header[cluecountpos] + 256 * p->header[cluecountpos + 1];
    stringcount += 4;
    for (i = 0 ; i < stringcount ; ++i) {
	len = strlen((char*)ptr);
	if (len) {
	    n = i >= 3 && i < stringcount - 1 ? len : len + 1;
	    checksum = getchecksum(ptr, n, checksum);
	}
	ptr += len + 1;
    }

    free(buf);
    rewind(fp);
    if (fputc(checksum & 0xFF, fp) == EOF)
	badfail(p->filename);
    if (fputc((checksum >> 8) & 0xFF, fp) == EOF)
	badfail(p->filename);
}

/* Modify the file's contents to match the current data in memory.
 */
static void writedestfile(FILE *fp, struct puzzle const *p)
{
    rewind(fp);
    if (fwrite(p->header, sizeof p->header, 1, fp) != 1)
	badfail(p->filename);
    if (fwrite(p->fill, p->width * p->height, 1, fp) != 1)
	badfail(p->filename);
    writefilechecksum(fp, p);
}

/*
 * The scrambling and unscrambling functions.
 */

/* Extract the letters from the fill to a buffer, reading columnwise
 * and omitting the squares that don't contain letters. The return
 * value is the number of letters copied into the buffer.
 */
static int filltobuffer(byte *buffer, struct puzzle const *p)
{
    int n = 0;
    int i, j;

    for (i = 0 ; i < p->width ; ++i)
	for (j = 0 ; j < p->height ; ++j)
	    if (isletter(p->fill[j * p->width + i]))
		buffer[n++] = p->fill[j * p->width + i];
    return n;
}

/* Put the contents of the buffer back into the fill.
 */
static void buffertofill(struct puzzle *p, byte const *buffer)
{
    int n = 0;
    int i, j;

    for (i = 0 ; i < p->width ; ++i)
	for (j = 0 ; j < p->height ; ++j)
	    if (isletter(p->fill[j * p->width + i]))
		p->fill[j * p->width + i] = buffer[n++];
}

/* Scramble the fill using the given key. The unscrambled fill's
 * checksum is computed at this point.
 */
static void scramble(struct puzzle *p, char key[4])
{
    static byte buffer[MAXGRIDSIZE], tmp[MAXGRIDSIZE];
    int size;
    int i, j, k, n;

    size = filltobuffer(buffer, p);
    if (size < 12)
	die("too few characters to scramble (minimum size is 12)");
    p->fillchecksum = getchecksum(buffer, size, 0);
    for (i = 0 ; i < size ; ++i)
	buffer[i] -= 'A';

    memcpy(tmp, buffer, size);
    j = -1;
    for (i = 0 ; i < size ; ++i) {
	j += 16;
	while (j >= size)
	    j -= size | 1;
	buffer[j] = tmp[i];
    }

    for (k = 0 ; k < 4 ; ++k) {
	n = 1 << (4 - k);
	j = -1;
	for (i = 0 ; i < size ; ++i) {
	    j += n;
	    while (j >= size)
		j -= size | 1;
	    buffer[j] = (buffer[j] + key[i % 4]) % 26;
	}
	if (n > size)
	    n -= size | 1;
	for (i = 0 ; i < key[k] ; ++i) {
	    memcpy(tmp, buffer, n);
	    if (size % 2 == 0) {
		memmove(tmp + 1, tmp, n);
		tmp[0] = tmp[n];
	    }
	    memmove(buffer, buffer + n, size - n);
	    memcpy(buffer + size - n, tmp, n);
	}
    }

    for (i = 0 ; i < size ; ++i)
	buffer[i] += 'A';
    buffertofill(p, buffer);
    p->scrambled = 1;
}

/* Unscramble the fill using the given key, and verify the result
 * against the stored checksum.
 */
static void unscramble(struct puzzle *p, char key[4])
{
    static byte buffer[MAXGRIDSIZE], tmp[MAXGRIDSIZE];
    int size;
    int i, j, k, n;

    size = filltobuffer(buffer, p);
    if (size < 12)
	die("too few characters to unscramble (minimum size is 12)");
    for (i = 0 ; i < size ; ++i)
	buffer[i] -= 'A';

    for (k = 4 ; k-- > 0 ; ) {
	n = 1 << (4 - k);
	if (n > size)
	    n -= size | 1;
	for (i = 0 ; i < key[k] ; ++i) {
	    memcpy(tmp, buffer + size - n, n);
	    if (size % 2 == 0) {
		tmp[n] = tmp[0];
		memmove(tmp, tmp + 1, n);
	    }
	    memmove(buffer + n, buffer, size - n);
	    memcpy(buffer, tmp, n);
	}
	j = -1;
	for (i = 0 ; i < size ; ++i) {
	    j += 1 << (4 - k);
	    while (j >= size)
		j -= size | 1;
	    buffer[j] = (buffer[j] - key[i % 4] + 26) % 26;
	}
    }

    memcpy(tmp, buffer, size);
    j = -1;
    for (i = 0 ; i < size ; ++i) {
	j += 16;
	while (j >= size)
	    j -= size | 1;
	buffer[i] = tmp[j];
    }

    for (i = 0 ; i < size ; ++i)
	buffer[i] += 'A';
    if (getchecksum(buffer, size, 0) != p->fillchecksum)
	die("incorrect key provided (internal checksum does not match).");
    buffertofill(p, buffer);
    p->scrambled = 0;
}

/*
 * Top-level functions.
 */

/* This is how the Across Lite program picks a key, when asked to
 * scramble a puzzle.
 */
static void getkeyfromtime(char key[4])
{
    time_t t;
    int n;

    t = time(NULL);
    n = 0;
    while (t > 0 && n < 4) {
	t /= 10;
	key[n] = t % 10;
	if (key[n] != 0)
	    ++n;
    }
    if (n < 4) {
	key[0] = 4;
	key[1] = 2;
	key[2] = 3;
	key[3] = 7;
    }
}

/* Read the command-line arguments, which should consist of a filename
 * and an optional four-digit key value. If no key value is given, the
 * key buffer is set to all-zeroes.
 */
static char *parsecmdline(int argc, char *argv[], char *key)
{
    char *filename;
    int i;

    if (argc <= 1 || !strcmp(argv[1], "--help") || argc > 3) {
        fprintf(argc > 3 ? stderr : stdout,
	        "Usage: scramble [KEY] FILENAME\n"
	        "Scrambles the puzzle in filename if it is unscrambled,\n"
	        "otherwise unscrambles the puzzle. In either case, FILENAME\n"
	        "is modified in place. KEY must be a four-digit number with\n"
	        "no zeroes. If KEY is omitted, one is selected randomly.\n");
	exit(argc > 3 ? EXIT_FAILURE : EXIT_SUCCESS);
    }
    if (argc < 3) {
	memset(key, 0, 4);
	filename = argv[1];
    } else {
	if (strspn(argv[1], "123456789") != 4 || argv[1][4] != '\0')
	    die("invalid key \"%s\"", argv[1]);
	for (i = 0 ; i < 4 ; ++i)
	    key[i] = argv[1][i] - '0';
	filename = argv[2];
    }
    return filename;
}

/* main().
 */
int main(int argc, char *argv[])
{
    struct puzzle puz;
    char key[4];
    FILE *fp;

    puz.filename = parsecmdline(argc, argv, key);
    if (!*key)
	getkeyfromtime(key);
    fp = fopen(puz.filename, "r+b");
    if (!fp)
	fail(puz.filename);

    readsrcfile(fp, &puz);

    if (dryRun == 1)
    print_puzzle_fields(puz);
    if (puz.scrambled) {
	printf("Unscrambling puzzle with the key %c%c%c%c ...\n",
	       '0' + key[0], '0' + key[1], '0' + key[2], '0' + key[3]);

    if (dryRun == 1)
    return 0;
	unscramble(&puz, key);
    } else {
	printf("Scrambling puzzle with the key %c%c%c%c ...\n",
	       '0' + key[0], '0' + key[1], '0' + key[2], '0' + key[3]);
    if (dryRun == 1)
    return 0;
	scramble(&puz, key);
    }
    updateheader(&puz);
    writedestfile(fp, &puz);

    fclose(fp);
    return 0;
}