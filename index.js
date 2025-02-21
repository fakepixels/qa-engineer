#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('node:fs');
const path = require('node:path');

// Function to write CSV report
function writeCSVReport(brokenLinks) {
  let csvContent = 'URL,Error\n';
  for (const item of brokenLinks) {
    // Escape potential commas in URL or error by wrapping in quotes
    csvContent += `"${item.url}","${item.error}"\n`;
  }
  fs.writeFileSync(path.join(process.cwd(), 'broken-links.csv'), csvContent);
  console.log('CSV report generated: broken-links.csv');
}

// Function to write Markdown report
function writeMarkdownReport(brokenLinks) {
  let mdContent = '# Broken Links Report\n\n';
  mdContent += '| URL | Error |\n';
  mdContent += '| --- | ----- |\n';
  for (const item of brokenLinks) {
    mdContent += `| ${item.url} | ${item.error} |\n`;
  }
  fs.writeFileSync(path.join(process.cwd(), 'broken-links.md'), mdContent);
  console.log('Markdown report generated: broken-links.md');
}

async function checkLinks(baseUrl) {
  const visited = new Set();
  const queue = [baseUrl];
  const brokenLinks = [];
  
  console.log(`Starting link check from: ${baseUrl}`);
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set a reasonable timeout for navigation
  page.setDefaultNavigationTimeout(30000);

  while (queue.length) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      console.log(`Checking: ${currentUrl}`);
      
      // Navigate to the current URL and follow redirects
      const response = await page.goto(currentUrl, { 
        waitUntil: 'networkidle0',
        followRedirect: true 
      });
      
      const status = response.status();
      
      // Check if status code indicates an error
      // 2xx are success codes
      // 3xx are redirect codes (which Puppeteer follows automatically)
      if (status < 200 || status >= 400) {
        let errorMsg;
        if (status === 404) {
          errorMsg = 'Page not found (404)';
        } else if (status === 403) {
          errorMsg = 'Access forbidden (403)';
        } else if (status === 500) {
          errorMsg = 'Server error (500)';
        } else if (status === 502) {
          errorMsg = 'Bad gateway (502)';
        } else if (status === 503) {
          errorMsg = 'Service unavailable (503)';
        } else if (status === 504) {
          errorMsg = 'Gateway timeout (504)';
        } else {
          errorMsg = `Returned status ${status}`;
        }
        
        console.error(`Error: ${currentUrl} - ${errorMsg}`);
        brokenLinks.push({ url: currentUrl, error: errorMsg });
        continue;
      }

      // Extract all href values from anchor tags on the page
      const links = await page.evaluate(() => {
        const anchors = document.querySelectorAll('a');
        return Array.from(anchors, a => a.href).filter(href => !!href);
      });

      // Queue internal links for further checking
      for (const link of links) {
        try {
          const url = new URL(link);
          const baseUrlObj = new URL(baseUrl);
          
          // Only check links from the same domain
          if (url.hostname === baseUrlObj.hostname && !visited.has(link)) {
            queue.push(link);
          }
        } catch (e) {
          console.error(`Invalid URL: ${link}`);
        }
      }
    } catch (error) {
      let errorMsg;
      if (error.name === 'TimeoutError') {
        errorMsg = 'Page load timed out';
      } else if (error.name === 'NetworkError') {
        errorMsg = 'Network connection failed';
      } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        errorMsg = 'DNS lookup failed';
      } else if (error.message.includes('ERR_CONNECTION_REFUSED')) {
        errorMsg = 'Connection refused';
      } else if (error.message.includes('ERR_SSL_PROTOCOL_ERROR')) {
        errorMsg = 'SSL/TLS error';
      } else {
        errorMsg = error.message;
      }
      
      console.error(`Failed to load ${currentUrl}: ${errorMsg}`);
      brokenLinks.push({ url: currentUrl, error: errorMsg });
    }
  }

  await browser.close();

  // Generate the reports
  console.log('\nScan completed!');
  console.log(`Total URLs checked: ${visited.size}`);
  console.log(`Broken links found: ${brokenLinks.length}`);

  if (brokenLinks.length > 0) {
    writeCSVReport(brokenLinks);
    writeMarkdownReport(brokenLinks);
  } else {
    console.log('No broken links detected.');
  }
}

// Get the URL from CLI arguments
const startUrl = process.argv[2];

if (!startUrl) {
  console.error('Please provide a starting URL.');
  console.error('Usage: node index.js <url>');
  process.exit(1);
}

// Validate URL format
try {
  new URL(startUrl);
} catch (e) {
  console.error('Invalid URL format. Please provide a valid URL including the protocol (e.g., https://example.com)');
  process.exit(1);
}

// Start the link checking process
checkLinks(startUrl).catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
});
