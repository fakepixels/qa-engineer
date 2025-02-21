# QA Engineer

A command-line tool for automated website link checking. This tool helps QA engineers and web developers identify broken links across their websites by crawling pages and validating all internal links.

## Features

- 🔍 Recursive website crawling
- 🌐 Domain-scoped link checking (only checks internal links)
- 📊 Generates both CSV and Markdown reports
- ⚡ Real-time progress tracking
- 🚨 Detailed error reporting
- ⏱️ Configurable navigation timeouts

## Installation

```bash
# Install globally from npm
npm install -g qa-engineer

# Or install globally from source
git clone https://github.com/yourusername/qa-engineer.git
cd qa-engineer
npm install
npm install -g .
```

## Usage

```bash
qa-engineer https://mywebsite.test [--external|-e]
```

Replace `https://mywebsite.test` with the website URL you want to check.

Options:
- `--external` or `-e`: Enable checking of external links (links to other domains)

### Example Output

```
Starting link check from: https://mywebsite.test
Checking: https://mywebsite.test
Checking: https://mywebsite.test/about
Checking: https://mywebsite.test/contact
...

Scan completed!
Total URLs checked: 25
Broken links found: 3
  Internal broken links: 1
  External broken links: 2

CSV report generated: broken-links.csv
Markdown report generated: broken-links.md
```

### Reports

The tool generates two types of reports:

1. **CSV Report** (broken-links.csv):
   ```csv
   URL,Domain Type,Error
   "https://mywebsite.test/missing-page","Internal","Page not found (404)"
   "https://external-site.test/broken","External","Connection refused"
   "https://another-site.test/error","External","Server error (500)"
   ```

2. **Markdown Report** (broken-links.md):
   ```markdown
   # Broken Links Report

   | URL | Domain Type | Error |
   | --- | ----------- | ----- |
   | https://mywebsite.test/missing-page | Internal | Page not found (404) |
   | https://external-site.test/broken | External | Connection refused |
   | https://another-site.test/error | External | Server error (500) |
   ```

## How It Works

1. Starts at the provided base URL
2. Uses Puppeteer to load and render the page
3. Extracts all anchor tags (`<a>` elements)
4. Filters for internal links (same domain)
5. Recursively visits each unvisited link
6. Records any errors or non-200 status codes
7. Generates detailed reports of findings

## Technical Details

- Built with Node.js and Puppeteer
- Handles dynamic JavaScript-rendered content
- Respects robots.txt through Puppeteer
- Smart error detection:
  - HTTP status codes (404, 403, 500, etc.)
  - Network issues (timeouts, DNS failures, SSL errors)
  - Access restrictions
- Domain-aware link checking:
  - Internal links (same domain as base URL)
  - External links (different domains, optional)
- Configurable 30-second timeout per page
- Memory-efficient using a queue-based crawler

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/qa-engineer.git

# Install dependencies
cd qa-engineer
npm install

# Make your changes

# Install globally to test
npm install -g .
```

## License

ISC

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
