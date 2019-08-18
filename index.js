const wreck = require('wreck');
const parser = require('fast-xml-parser');
const url = require('url');
const parserOptions = {};

const tags = ['loc', 'lastmod', 'changefreq', 'priority'];
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
    Object.keys(entry).forEach(key => {
      if (tags.includes(key)) {
        headerRow[key] = true;
      }
    });
  });
  const fields = Object.keys(headerRow);
  if (expandPaths) {
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
  }
  console.log(Object.keys(headerRow).join(','));
  // generate each row as csv:
  allParsedSitemaps.forEach(entry => {
    const row = fields.map(fieldName => {
      if (entry[fieldName]) {
        return entry[fieldName];
      }
      return '';
    });
    if (expandPaths) {
      const path = new URL(entry.loc).pathname;
      row.push(path);
      // store the components of the path as well:
      path.split('/').forEach((component, i) => {
        // first one will be blank again:
        if (i > 0) {
          row.push(component);
        }
      });
    }
    console.log(row.join(','));
  });
};

sitemap2csv = async(url) => {
  const sitemap = await getSitemap(url);
  await parseXml(sitemap);
};

// builds the site structure witht he --structure option
const structureBody = {};
const buildStructure = (entry) => {
  const path = new URL(entry.loc).pathname;
  const parts = path.split('/');
  // iterate over the path components and count the number of occurences:
  for (let i = 0; i < parts.length; i++) {
    const currentPath = parts.slice(0, i).join('/');
    if (currentPath !== '') {
      structureBody[currentPath] = structureBody[currentPath] ? structureBody[currentPath] + 1 : 1;
    }
  }
};

module.exports = async(url, expandPaths = false, structure = true) => {
  await sitemap2csv(url);
  if (structure) {
    allParsedSitemaps.forEach(entry => {
      buildStructure(entry);
    });
    console.log(structureBody);
  } else {
    exportCsv(expandPaths);
  }
};
