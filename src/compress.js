const path = require('path');
const tar = require('tar');

tar.c(
  {
    cwd: `${__dirname}/..`,
    gzip: true,
    file: 'PeopleTools.tgz',
    filter: name => {
      if (path.basename(name) === '.gitignore') return false;
      return path.extname(name) !== '.db';
    },
    preservePaths: false
  },
  ['PeopleTools.docset']
);
