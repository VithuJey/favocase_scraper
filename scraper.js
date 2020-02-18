const puppeteer = require("puppeteer");

// URL to be scraped
let URL =
  "https://favocase.com/collections/iphone-11-pro-max-case?sort_by=created-ascending";

// Open the above URL in a browser's new page
const ping = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 926 });
  await page.goto(URL, {waitUntil: 'load'});
  return { page, browser };
};

// Evaluate & scrape
const scrape = async () => {
  const { page, browser } = await ping();

  const items = await page.evaluate(async () => {
    let caseDetailsArr = [];

    try {
      let pageCount = document.querySelector("span[class='pagecount']")
        .innerText;
      let next = "";

      while (next !== null) {
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

          next = document.querySelector("a[class='next']");
          if (next !== null) page.goto(next.href, {waitUntil: 'load'});
        });
      }
    } catch (error) {
      console.log(error);
    }

    return caseDetailsArr;
  });
  console.log(items);
};

scrape();
