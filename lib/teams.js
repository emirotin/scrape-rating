const Promise = require("bluebird");
const rp = require("request-promise");
const cheerio = require("cheerio");
const range = require("lodash/range");
const iconv = require("iconv");

const PAGE_SIZE = 500;

const conv = new iconv.Iconv("windows-1251", "utf8");

const crawl = url =>
  rp({
    uri: url,
    encoding: "binary",
    transform: body =>
      cheerio.load(conv.convert(new Buffer(body, "binary")).toString())
  });

const pageUrl = pageNum =>
  `http://rating.chgk.info/teams.php?order=rating&page=${pageNum}`;

const fetchPage = pageNum => {
  const url = pageUrl(pageNum);
  return crawl(url).then($ => {
    const $trs = $("#teams_table tbody tr");
    return $trs
      .map((i, tr) => {
        const $tds = $(tr).find("td");
        return {
          id: $tds
            .eq(6)
            .text()
            .trim(),
          name: $tds
            .eq(7)
            .find("span")
            .eq(0)
            .find("a")
            .eq(1)
            .text()
            .trim()
        };
      })
      .get();
  });
};

exports.fetch = limit => {
  const pagesCount = Math.ceil(limit / PAGE_SIZE);
  return Promise.reduce(
    range(1, pagesCount + 1),
    (acc, pageNum) => fetchPage(pageNum).then(page => acc.concat(page)),
    []
  ).then(a => a.slice(0, limit));
};
