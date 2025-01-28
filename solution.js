const axios = require("axios");
const readline = require("readline");

const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";
const KEVIN_BACON_TITLE = "Kevin_Bacon";

/**
 * Extracts the Wikipedia page title from a URL or directly uses the provided title.
 * @param {string} input - The input provided by the user.
 * @returns {string} - The Wikipedia page title.
 */
function extractTitle(input) {
  if (input.startsWith("https://en.wikipedia.org/wiki/")) {
    return input.replace("https://en.wikipedia.org/wiki/", "").replace(/_/g, " ");
  }
  return input.replace(/_/g, " ");
}

/**
 * Fetches links from a Wikipedia page using the Wikipedia API.
 * @param {string} title - The title of the Wikipedia page.
 * @returns {Promise<string[]>} - A promise that resolves to an array of linked page titles.
 */
async function fetchWikiLinks(title) {
  try {
    const response = await axios.get(WIKIPEDIA_API_URL, {
      params: {
        action: "query",
        titles: title,
        prop: "links",
        format: "json",
        pllimit: "max",
      },
    });

    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (!pages[pageId].links) {
      return [];
    }

    return pages[pageId].links.map(link => link.title);
  } catch (error) {
    console.error(`Error fetching links for ${title}: ${error.message}`);
    return [];
  }
}

/**
 * Finds the separation between a given page and the Kevin Bacon page.
 * @param {string} startTitle - The title of the starting Wikipedia page.
 * @returns {Promise<number>} - The degree of separation or -1 if not reachable.
 */
async function findDegreeOfSeparation(startTitle) {
  const queue = [[startTitle, 0]]; // Queue of [title, degree]
  const visited = new Set();

  while (queue.length > 0) {
    const [currentTitle, degree] = queue.shift();

    // Check if we've reached the Kevin Bacon page
    if (currentTitle === KEVIN_BACON_TITLE) {
      return degree;
    }

    // Skip already visited pages
    if (visited.has(currentTitle)) {
      continue;
    }

    visited.add(currentTitle);

    // Fetch links for the current page
    const links = await fetchWikiLinks(currentTitle);

    const promises = links.map(link => fetchWikiLinks(link));
    const results = await Promise.all(promises);

    results.forEach((links, index) => {
        links.forEach(link => {
            if (!visited.has(link)) {
            queue.push([link, degree + 1]);
            }
        });
    });
  }

  return -1; // Kevin Bacon's page is not reachable
}

/**
 * Sets up the CLI to accept a starting Wikipedia page title or URL and computes the result.
 */
function setupCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter the Wikipedia page title or URL to start from: ", async (input) => {
    const startTitle = extractTitle(input);
    console.log(`Finding the degree of separation from ${startTitle} to Kevin Bacon...`);

    const degree = await findDegreeOfSeparation(startTitle);

    if (degree === -1) {
      console.log("Kevin Bacon's page is not reachable from the given page.");
    } else {
      console.log(`Degree of separation: ${degree}`);
    }

    rl.close();
  });
}

setupCLI();
