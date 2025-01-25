const fs = require('fs');
const https = require('https');
const httpProxy = require('http-proxy');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));




const prod_url = "https://proxy-green-one.vercel.app/proxy?target=https://smartsearch.spefix.com"

app.use(cors({
    origin: prod_url,
}))


// Environment variables
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8082;

const sslKeyPath = process.env.SSL_KEY || './certs/ssl.key'; // Path to private key file
const sslCertPath = process.env.SSL_CERT || './certs/ssl.crt'; // Path to certificate file
const sslCaPath = process.env.SSL_CA || './certs/ca.pem'; // Path to CA bundle (optional)

if (!fs.existsSync(sslKeyPath) || !fs.existsSync(sslCertPath)) {
    console.error('SSL key and certificate files are required for HTTPS.');
    process.exit(1);
}

const sslOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
    ca: fs.existsSync(sslCaPath) ? fs.readFileSync(sslCaPath) : undefined,
};

// Set up proxy
const proxy = httpProxy.createProxyServer({

    timeout: 10000, // Set timeout (in milliseconds)
});

// Add CORS headers to proxy responses (place it here)
proxy.on('proxyRes', (proxyRes, req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
});


// Middleware to handle CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Proxy route
app.use('/proxy', (req, res) => {
    const target = req.query.target;

    if (!target) {
        return res.status(400).json({ error: 'Target URL is required as a query parameter, e.g., /proxy?target=http://example.com' });
    }

    proxy.web(req, res, {
        target,
        changeOrigin: true,
        headers: {
            'Content-Type': req.headers['content-type'] || 'application/json'
        }
    }, (err) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy failed', details: err.message });
    });
});

// Create HTTPS server
https.createServer(sslOptions, app).listen(port, host, () => {
    console.log(`CORS Proxy running at https://${host}:${port}`);
});