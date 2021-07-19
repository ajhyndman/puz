# Polyfills

This package relies on the following modern JavaScript features. You may need
to include polyfills in your project to support all browsers, or older
versions of Node.

- Node's [Buffer](https://nodejs.org/api/buffer.html) class ([web polyfill](https://github.com/feross/buffer) available)
- [String.prototype.replaceAll()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll)

# Acknowledgments

This package wouldn't have been possible without the work of the following individuals:

[Alex DeJarnatt](https://github.com/alexdej)'s excellent python implementation: https://github.com/alexdej/puzpy

[Josh Myer](http://joshisanerd.com/) and everyone else who contributed to the [Google Code .puz file format documentation](https://code.google.com/archive/p/puz/wikis/FileFormat.wiki)

[Brian Raiter](http://www.muppetlabs.com/~breadbox/) for reverse engineering the [.puz file scrambling algorithm](http://www.muppetlabs.com/~breadbox/txt/acre.html ) and publishing his findings.
