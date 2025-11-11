const fs = require("fs");
const path = require("path");

const srcFile = path.join(
    __dirname,
    "../node_modules/plotly.js/dist/plotly-strict.min.js"
);
const destDir = path.join(__dirname, "../dist/lib/plotly");
const destFile = path.join(destDir, "plotly-strict.min.js");

// Create directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Copy the file
fs.copyFileSync(srcFile, destFile);
console.log(`Copied plotly.js to ${destFile}`);
