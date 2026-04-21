// ExNo:7 - Node.js based Web Development (without Express.js)
// Demonstrates: http, fs, path, url built-in modules

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Parse the incoming URL using the 'url' module
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    console.log(`[${req.method}] ${pathname}`);

    // Route: Home page - serves static HTML using 'fs' module
    if (pathname === '/' || pathname === '/home') {
        const filePath = path.join(__dirname, 'public', 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading home page');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    }

    // Route: About page
    else if (pathname === '/about') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>About Page</h1><p>Built with pure Node.js - no frameworks!</p><a href="/">Home</a>');
    }

    // Route: Greet user - uses URL query parameters
    else if (pathname === '/greet') {
        const name = query.name || 'Guest';
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h1>Hello, ${name}!</h1><p>Try /greet?name=YourName</p><a href="/">Home</a>`);
    }

    // Route: Read a file using fs module
    else if (pathname === '/readfile') {
        const filePath = path.join(__dirname, 'sample.txt');
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(data);
        });
    }

    // Route: Write to a file using fs module
    else if (pathname === '/writefile') {
        const content = query.text || 'Default content written at ' + new Date();
        const filePath = path.join(__dirname, 'sample.txt');
        fs.writeFile(filePath, content, (err) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error writing file');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<h1>File written successfully!</h1><p>Content: ${content}</p><a href="/readfile">Read it</a>`);
        });
    }

    // Route: Info about the request using url & path modules
    else if (pathname === '/info') {
        const info = {
            method: req.method,
            pathname: pathname,
            query: query,
            headers: req.headers,
            pathJoined: path.join('folder', 'subfolder', 'file.txt'),
            pathParsed: path.parse(__filename),
            urlParsed: parsedUrl
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info, null, 2));
    }

    // Handle POST request
    else if (pathname === '/submit' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: body, status: 'success' }));
        });
    }

    // 404 - Not Found
    else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Page Not Found</h1><a href="/">Go Home</a>');
    }
});

server.listen(PORT, () => {
    console.log(`Node.js server running at http://localhost:${PORT}/`);
    console.log('Available routes:');
    console.log('  /              - Home page (serves HTML file)');
    console.log('  /about         - About page');
    console.log('  /greet?name=X  - Greet a user (URL query)');
    console.log('  /readfile      - Read sample.txt (fs module)');
    console.log('  /writefile?text=X - Write to sample.txt');
    console.log('  /info          - Request/path/URL info');
    console.log('  POST /submit   - Handle POST data');
});
