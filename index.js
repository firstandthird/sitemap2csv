const wreck = require('wreck');
const parser = require('fast-xml-parser');
const url = require('url');
const parserOptions = {};

let allParsedSitemaps = [];
let sitemap2csv;

const getSitemap = async (url) => {
  const { payload } = await wreck.get(url, {});
  return payload.toString();
};

const parseXml = async (xmlContent) => {
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
  }
};

// prints parsed sitemap to stdout in csv form;
const exportCsv = async (expandPaths) => {
  // do a sweep to get all the field names for the header row:
  const headerRow = {};
  allParsedSitemaps.forEach(entry => {
    const fields = Object.keys(entry).forEach(key => {
      headerRow[key] = true;
    });
  });
  const fields = Object.keys(headerRow);
  console.log(fields.join(','));
  // generate each row as csv:
  allParsedSitemaps.forEach(entry => {
    const row = fields.map(fieldName => {
      if (entry[fieldName]) {
        return entry[fieldName];
      }
      return '';
    });
    console.log(row.join(','));
  });
};

// expands the components of each url path into columns:
const exportCsvExpandPath = async (expandPaths) => {
  // do a sweep to get all the field names for the header row:
  const headerRow = {};
  allParsedSitemaps.forEach(entry => {
    Object.keys(entry).forEach(key => {
      headerRow[key] = true;
    });
  });
  const fields = Object.keys(headerRow);
  // do an additional sweep to get all the path component names needed for the header row:
  // eg 'folder1,folder2,folder3'
  //add a 'path' field at the end:
  headerRow.path = true;
  allParsedSitemaps.forEach(entry => {
    const path = new URL(entry.loc).pathname;
    path.split('/').forEach((component, i) => {
      // first one will be blank:
      if (i > 0) {
        headerRow[`folder${i}`] = true;
      }
    });
  });
  console.log(Object.keys(headerRow).join(','));
  // generate each row as csv, include the path and each of its components as well:
  allParsedSitemaps.forEach(entry => {
    const row = fields.map(fieldName => {
      if (entry[fieldName]) {
        return entry[fieldName];
      }
      return '';
    });
    const path = new URL(entry.loc).pathname;
    row.push(path);
    // store the components of the path as well:
    path.split('/').forEach((component, i) => {
      // first one will be blank again:
      if (i > 0) {
        row.push(component);
      }
    });
    console.log(row.join(','));
  });
};

sitemap2csv = async(url) => {
  const sitemap = await getSitemap(url);
  await parseXml(sitemap);
};

module.exports = async(url, expandPaths = false) => {
  await sitemap2csv(url);
  if (expandPaths) {
    return exportCsvExpandPath();
  }
  return exportCsv();
};
