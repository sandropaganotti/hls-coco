// server.js
const express = require("express");
// const fs = require("fs");
// const https = require("https");

// get certs
// const key = fs.readFileSync("./key.pem");
// const cert = fs.readFileSync("./cert.pem");

// create an app
const app = express();

// only static files for now
app.use(express.static("static"));

// https server
// const server = https.createServer({ key: key, cert: cert }, app);

// listen port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
