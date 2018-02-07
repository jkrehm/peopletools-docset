const fs = require('fs');
const cheerio = require('cheerio');
const mkdirp = require('mkdirp');
const path = require('path');
const pretty = require('pretty');
const request = require('request-promise');
const sqlite3 = require('sqlite3');
const zlib = require('zlib');
const { sleep } = require('./util');
const docs = require('./docs');

const resources = `${__dirname}/../PeopleTools.docset/Contents/Resources`;
const docSetDB = new sqlite3.Database(`${resources}/docSet.dsidx`);
const resourcesDB = new sqlite3.Database(`${resources}/resources.db`);

docSetDB.exec('delete from SearchIndex');
resourcesDB.exec('delete from FilePaths');
resourcesDB.exec('delete from Files');

const insertIndex = docSetDB.prepare('insert into SearchIndex (name, type, path) values(?, ?, ?)');
const insertFilePath = resourcesDB.prepare('insert into FilePaths (FileKey, Path) values(?, ?)');
const insertFile = resourcesDB.prepare('insert into Files (Key, Content) values(?, ?)');

let counter = 1;

const getDocs = async ([type, urls]) => {
  for (let i=0; i<urls.length; i++) {
    const url = urls[i];
    const uri = `https://docs.oracle.com/${url}`;
    const styleRelPath = '../'.repeat((url.match(/\//g) || []).length);

    console.log(`Requesting from ${uri}`);

    let $;
    try {
      $ = cheerio.load(await request(uri));
    } catch (ex) {
      console.error(url);
      continue;
    }

    // Clean up HTML
    $('header,img,link,script').remove();
    $('meta[name]').remove();
    $('#ContentsNavBar,#i_nav,#searchbox').remove();
    $('.previouslink,.nextlink').remove();

    $('a[target="_blank"]').each((index, el) => {
      $(el).removeAttr('target');
    });

    // Add stylesheet
    $('<link/>')
      .attr('rel', 'stylesheet')
      .attr('type', 'text/css')
      .attr('href', `${styleRelPath}style.css`)
      .appendTo('head');
    $('#ContentsNavBar').addClass('scroll-wrapper psc_hidden');

    // Insert indexes into database
    if (type !== 'Other') {
      $('.topic.pstopic2.nested1 > .title').each((index, el) => {
        const $el = $(el);
        const id = $el.attr('id');
        const name = $el.find('span').first().text();

        insertIndex.run(name, type, url + '#' + id, err => err && console.error(err, url));
      });
    }

    const html = pretty($.html(), { ocd: true });

    // Insert file into database
    insertFilePath.run(counter, `Documents/${url}`, err => err && console.error(err, url));
    insertFile.run(counter, zlib.gzipSync(html), err => err && console.error(err, url));
    counter++;

    // Export to file
    const filePath = `${resources}/Documents/${url}`;
    mkdirp.sync(path.dirname(filePath));
    fs.writeFileSync(filePath, html);

    await sleep(1000);
  }
}

// Add styles
insertFilePath.run(counter, 'Documents/style.css');
insertFile.run(counter, zlib.gzipSync(fs.readFileSync(`${resources}/Documents/style.css`)));
counter++;

// Generate docs
Object.entries(docs).forEach(getDocs);
