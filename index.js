const wreck = require('wreck');
const parser = require('fast-xml-parser');

const options = {};

let allParsedSitemaps = [];
let sitemap2csv;

const getSitemap = async (url) => {
  const { payload } = await wreck.get(url, {});
  return payload.toString();
};

const parseXml = async (xmlContent) => {
  const result = parser.validate(xmlContent);
  if (result === true) {
    const parsedSitemap = parser.parse(xmlContent, options);
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
const exportCsv = async () => {
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

sitemap2csv = async(url) => {
  const sitemap = await getSitemap(url);
  await parseXml(sitemap);
};

module.exports = async(url) => {
  await sitemap2csv(url);
  exportCsv();
};
