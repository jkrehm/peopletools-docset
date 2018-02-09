const fs = require('fs');
const cheerio = require('cheerio');
const mkdirp = require('mkdirp');
const path = require('path');
const pretty = require('pretty');
const request = require('request-promise');
const rimraf = require('rimraf');
const sqlite3 = require('sqlite3');
const { sleep } = require('./util');
const docs = require('./docs');

const resources = `${__dirname}/../PeopleTools.docset/Contents/Resources`;
const docSetDB = new sqlite3.Database(`${resources}/docSet.dsidx`);

// Clean up
rimraf.sync(`${resources}/Documents/cd`);
docSetDB.exec('delete from SearchIndex');

const insertIndex = docSetDB.prepare('insert into SearchIndex (name, type, path) values(?, ?, ?)');

const getDocs = async ([type, urls]) => {
  for (let i = 0; i < urls.length; i++) {
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
      const className =
        type === 'Method' || type === 'Property'
          ? $('#content')
              .find('h1.title')
              .text()
              .replace(/\n/, ' ')
              .replace(/Class (Methods|Properties)/, '')
              .trim()
          : '';

      $('.topic.pstopic2.nested1 > .title').each((index, el) => {
        const $el = $(el);
        const id = $el.attr('id');
        const descr = $el
          .find('span')
          .first()
          .text()
          .replace(/\n/, ' ')
          .trim();
        const name = className ? `${className}.${descr}` : descr;

        insertIndex.run(name, type, url + '#' + id, err => err && console.error(err, url));
      });
    }

    const html = pretty($.html(), { ocd: true });

    // Export to file
    const filePath = `${resources}/Documents/${url}`;
    mkdirp.sync(path.dirname(filePath));
    fs.writeFileSync(filePath, html);

    await sleep(1000);
  }
};

// Generate docs
Object.entries(docs).forEach(getDocs);
