const puppeteer = require('puppeteer');
const hummus = require('hummus');
const fs = require('fs');
const urls = require('./urls.js');
const path = require('path');

(async() => {

    // Init puppeteer and set viewport
    const browser = await puppeteer.launch();

    //await crawlFromFile(browser);
    await crawlSite(browser);

    await browser.close();

})();

// Crawl list of urls from urls.js
async function crawlFromFile(browser){
    
    const page = await browser.newPage();
    await page.setViewport({width: 1680, height: 1050});

    for (let i = 0, len = urls.length; i < len; i++){
        let url = urls[i];
        await page.goto(url);
        const pageTitle = await page.title();
        console.log('Tested: ' + pageTitle);
        await page.screenshot({path: `page-${i}.jpg`, fullPage: true});
    }
    
    let dirPath = path.resolve(__dirname);
    fs.readdir(dirPath, function (err, files) {
        let pdfs = files.filter(function(file) {
            return path.extname(file) === '.jpg';
        });
        combinePDF(pdfs);
    });

};

// Crawl site links through hrefs
async function crawlSite(browser){

    const page = await browser.newPage();
    await page.setViewport({width: 1680, height: 1050});

    await page.tracing.start({path: 'trace.json', categories: ['devtools.timeline']});
    await page.goto('https://www.google.com', {waitUntil: 'domcontentloaded'});

    let links = await page.evaluate(linksFromOrigin);

    for (let i = 0, len = links.length; i < len; i++){
        let url = links[i];
        await page.goto(url);
        const pageTitle = await page.title();
        console.log('Tested: ' + pageTitle);
        await page.screenshot({path: `page-${i}.jpg`, fullPage: true});
    }

}

// Crawl links from same domain as target site
function linksFromOrigin(){

    // temp array to hold all dom elements
    const elements = [];

    // crawl all dom elements
    const findElements = function(dom){
        for (let i = 0, el; el = dom[i]; i++){
            elements.push(el);
        }
    }

    findElements(document.querySelectorAll('*'));

    // filter out hrefs from same origin
    const filtered = elements
        .filter(el => el.localName === 'a' && el.href)
        .filter(el => el.href !== location.href)
        .filter(el => {
            return new URL(location).origin === new URL(el.href).origin;
        })
        .map(a => a.href);
    
    return Array.from(new Set(filtered));
}

// Combine screenshots taken in to single pdf
function combinePDF(pdfs){
    pdfWriter = hummus.createWriter('test.pdf');
    
    var imgWidth, imgHeight;

    for(let i = 0, len = pdfs.length; i < len; i++){
        let imageDimensions = pdfWriter.getImageDimensions(pdfs[i]);
        Object.keys(imageDimensions).forEach((item, index, arr) => {
            if(item == 'width'){
                imgWidth = imageDimensions[item];
            }
            if(item == 'height'){
                imgHeight = imageDimensions[item];
            }
        });
        let page = pdfWriter.createPage(0, 0, imgWidth, imgHeight);    
        pdfWriter.startPageContentContext(page)
            .drawImage(0,0,pdfs[i]);
        pdfWriter.writePage(page);        
    }

    pdfWriter.end();
}