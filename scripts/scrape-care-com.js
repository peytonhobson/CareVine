const puppeteer = require('puppeteer');

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function scrapeCity(city) {
  // Launch a new browser instance and create a new page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  https: try {
    await page.goto(
      `https://www.care.com/app/search?vertical=SENIOR_CARE&subvertical=HANDS_ON&zipcode=80525`,
      { waitUntil: 'networkidle0' }
    ); // wait until page load
    await page.setViewport({ width: 1200, height: 720 });
    await page.type('#emailId', 'Peyton.hobson1@gmail.com');
    await page.type('#password', '51505150Plh@');
    // click and wait for navigation
    await Promise.all([
      page.click('#btn_login_submit'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // Wait for the content to load. This is important, as the data you are looking for
    // is loaded dynamically. You might need to wait for a specific selector to appear.
    await page.waitForSelector('[data-testid="search-result"]');

    await autoScroll(page);

    // Extract the information from the page. This is a function that will execute in the
    // page context, allowing you to use the page's native DOM methods.
    const data = await page.evaluate(() => {
      const listingsCountElement = document.querySelector('#listings-count-selector'); // Placeholder
      const numOfListings = listingsCountElement ? listingsCountElement.innerText : 'N/A';

      const locationElements = document.querySelectorAll('.MuiTypography-root.MuiTypography-body2'); // Placeholder
      const locations = [];

      const regex = /^(.+),\s([A-Z]{2})\s(\d{5})$/;

      locationElements.forEach(element => {
        const textContent = element.innerText.trim();

        if (regex.test(textContent)) {
          locations.push(textContent);
        }
      });

      return {
        numOfListings,
        locations,
      };
    });

    console.log(`City: ${city}`);
    console.log(`Number of Listings: ${data.numOfListings}`);
    console.log(`Locations: ${data.locations.join(', ')}`);
  } catch (error) {
    console.error(`Error scraping ${city}: `, error.message);
  } finally {
    // Close the browser instance once you're done
    await browser.close();
  }
}

// Process the list of cities sequentially
async function main() {
  const cities = ['New York', 'Los Angeles', 'Chicago']; // Add more cities here

  await scrapeCity();
}

main();
