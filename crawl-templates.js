const parser = require('fast-xml-parser');
const url = require('url');
const wreck = require('wreck');
const fs = require('fs');

// number of urls to list for each url template
const urlsPerTemplate = 400;
// number of times a word can repeat before it is considered a 'reserved' word:
const reservedWordThreshold = 3;
const parserOptions = {};

let fileIndex = 0;

const getSitemap = async (url) => {
  // can stash xmls locally to save bandwidth
  const payload = fs.readFileSync(`${fileNameBase}_${fileIndex}.xml`);
  fileIndex++;
  // const { payload } = await wreck.get(url, {});
  return payload.toString();
};

// map of template name to list of urls that match that template
const allTemplates = {};

// words we don't replace:
const wordCounts = {};

const extractTemplate = (url) => {
};

let allParsedSitemaps = [];

const sitemap2csv = async(url) => {
  const sitemap = await getSitemap(url);
  allParsedSitemaps = allParsedSitemaps.concat(await parseXml(sitemap));
};

const parseXml = async (xmlContent) => {
  // uncommnet to stash large xmls:
  // fs.writeFileSync(`${fileNameBase}_${fileIndex}.xml`, xmlContent);
  // fileIndex++;
  const result = parser.validate(xmlContent);
  if (result === true) {
    const parsedSitemap = parser.parse(xmlContent, parserOptions);
    // if it's a sitemap index just get all the listed sitemaps that are indexed:
    if (parsedSitemap.sitemapindex && parsedSitemap.sitemapindex.sitemap) {
      // if there is just one loc it will be a single entry:
      if (parsedSitemap.sitemapindex.sitemap.loc) {
        return sitemap2csv(parsedSitemap.sitemapindex.sitemap.loc);
      }
      //otherwise each entry is stored in an array:
      await Promise.all(parsedSitemap.sitemapindex.sitemap.reduce((memo, s) => {
        if (s.loc) {
          memo.push(sitemap2csv(s.loc));
        }
        return memo;
      }, []));
    } else {
      allParsedSitemaps = allParsedSitemaps.concat(parsedSitemap.urlset.url);
    }
    return allParsedSitemaps;
  }
};

const fileNameBase = new URL(process.argv[2]).host;
const f = async() => {
  await sitemap2csv(process.argv[2]);
  // first sweep to get a list of reserved/duplicated words:
  allParsedSitemaps.forEach(entry => {
    let path = new URL(entry.loc).pathname;
    let parts = path.split('/');
    // first count all words to find the duplicated or 'reserved' words:
    parts.forEach((p, i) => {
      // if it's a word see if it's a dupe:
      if (isNaN(parseInt(p))) {
        wordCounts[p] = wordCounts[p] ? wordCounts[p] + 1 : 1;
      }
    });
  });
  const reservedWords = [];
  Object.keys(wordCounts).forEach(word => {
    if (wordCounts[word] > reservedWordThreshold) {
      reservedWords.push(word);
    }
  });
  // now sweep over and assign urls to the appropriate template bucket
  allParsedSitemaps.forEach(entry => {
    let path = new URL(entry.loc).pathname;
    let parts = path.split('/');
    let templateString = '';
    parts.forEach((p, i) => {
      // replace numbers with '<number>'
      // replace non-reserved words with '<string>'
      // keep reserved words
      if (isNaN(parseInt(p))) {
        if (reservedWords.includes(p)) {
          templateString = `${templateString}/${p}`;
        } else {
          templateString = `${templateString}/<string>`;
        }
      } else {
        templateString = `${templateString}/<number>`;
      }
    });
    if (allTemplates[templateString]) {
      // only add if not a dupe:
      let found = false;
      allTemplates[templateString].forEach(e => {
        if (path === e) {
          found = true;
        }
      });
      if (!found) {
        allTemplates[templateString].push(path);
      }
    } else {
      allTemplates[templateString] = [path];
    }
  });
  let total = 0;
  let max = 0;
  console.log('urls');
  Object.values(allTemplates).forEach(e => {
    for (var i = 0; i < Math.min(urlsPerTemplate, e.length); i++) {
      total += e.length;
      max = Math.max(e.length, max);
      console.log(e[i]);
    }
  });
};

f();
