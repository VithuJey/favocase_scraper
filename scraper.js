const puppeteer = require("puppeteer");
const json2xls = require("json2xls");
const fs = require("fs");

// URL to be scraped
let URL =
  "https://favocase.com/collections/iphone-11-pro-max-case?sort_by=created-ascending";

// Open the above URL in a browser's new page
const ping = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 926 });
  await page.setDefaultNavigationTimeout(0);
  await page.goto(URL, { waitUntil: "load" });
  return { page, browser };
};

// Evaluate & scrape
const scrape = async () => {
  const { page, browser } = await ping();

  let condition = true;
  let items = [];

  items = items.concat(await scrapeContent(page, URL));

  while (condition) {
    const nextURL = await page.evaluate(async () => {
      let next = (document.querySelector("a[class='next']") != null) ? document.querySelector("a[class='next']").href : null;
      return next;
    });
    if (nextURL != null) {
      console.log(nextURL);
      items = items.concat(await scrapeContent(page, nextURL));
    } else condition = false;
  }
  // console.log(items);
  const xls = await json2xls(items);
  await fs.writeFileSync("PhoneCases.xlsx", xls, "binary");

  browser.close();
};

const scrapeContent = async (page, nextURL) => {
  await page.goto(nextURL + "", { waitUntil: "load" });

  const items = await page.evaluate(async () => {
    let caseDetailsArr = [];

    try {
      let caseElems = document.querySelectorAll("div[class='product-block']");

      caseElems.forEach(async caseEle => {
        let caseJSON = {};

        caseJSON.img_link = caseEle.querySelector(
          "div[class='block-inner'] > div[class='image-cont'] > a[class='image-link more-info'] > img"
        ).src;
        caseJSON.title = caseEle.querySelector(
          "div[class='block-inner'] > div[class='image-cont'] > a[class='hover-info more-info'] > div[class='inner'] > div[class='innerer'] > div[class='title']"
        ).innerText;
        caseJSON.price = caseEle.querySelector(
          "div[class='block-inner'] > div[class='image-cont'] > a[class='hover-info more-info'] > div[class='inner'] > div[class='innerer'] > span[class='price']"
        ).innerText;

        caseDetailsArr.push(caseJSON);
      });
    } catch (error) {
      console.log(error);
    }

    return caseDetailsArr;
  });
  
  // console.log(items);

  return items;
};

scrape();
