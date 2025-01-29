const axios = require("axios");
const cheerio = require("cheerio");
const readline = require("readline");

const BASE_URL = "https://en.wikipedia.org";
const KEVIN_BACON_URL = `${BASE_URL}/wiki/Kevin_Bacon`;

/**
 * Fetches and parses the HTML content of a Wikipedia page to extract links.
 * @param {string} url - The Wikipedia page URL.
 * @returns {Promise<string[]>} - A promise that resolves to an array of links on the page.
 */
async function fetchWikiLinks(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const links = [];
    $("a[href^='/wiki/']").each((_, element) => {
      const href = $(element).attr("href");
      if (href && !href.includes(":") && !href.includes("#")) {
        links.push(BASE_URL + href);
      }
    });

    return links;
  } catch (error) {
    console.error(`Error fetching links for ${url}: ${error.message}`);
    return [];
  }
}

/**
 * Finds the degree of separation between a given page and the Kevin Bacon page using BFS.
 * @param {string} startUrl - The starting Wikipedia page URL.
 * @returns {Promise<number>} - The degree of separation or -1 if not reachable.
 */
async function findDegreeOfSeparation(startUrl) {
  const queue = [[startUrl, 0]]; // Queue of [url, degree]
  const visited = new Set();

  while (queue.length > 0) {
    const [currentUrl, degree] = queue.shift();

    // Check if we've reached the Kevin Bacon page
    if (currentUrl === KEVIN_BACON_URL) {
      return degree;
    }

    // Skip already visited pages
    if (visited.has(currentUrl)) {
      continue;
    }

    visited.add(currentUrl);

    // Fetch links for the current page
    const links = await fetchWikiLinks(currentUrl);

    // Add unvisited links to the queue
    for (const link of links.slice(0, 50)) { // Limit to 50 links per page
      if (!visited.has(link)) {
        queue.push([link, degree + 1]);
      }
    }
  }

  return -1; // Kevin Bacon's page is not reachable
}

/**
 * Sets up the CLI to accept a starting Wikipedia page URL and computes the result.
 */
function setupCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter the Wikipedia page URL to start from: ", async (startUrl) => {
    console.log(`Finding the degree of separation from ${startUrl} to Kevin Bacon...`);

    const degree = await findDegreeOfSeparation(startUrl);

    if (degree === -1) {
      console.log("Kevin Bacon's page is not reachable from the given page.");
    } else {
      console.log(`Degree of separation: ${degree}`);
    }

    rl.close();
  });
}

setupCLI();
