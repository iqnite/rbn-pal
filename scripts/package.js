const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const packageJson = require("../package.json");
const version = packageJson.version;
const outputFile = `rbn-pal-${version}.zip`;

// Files to include in the package
const filesToInclude = [
    "manifest.json",
    "dist/content.js",
    "dist/lib/plotly/plotly-strict.min.js",
    "assets/icon.png",
    "LICENSE",
    "README.md",
];

// Create output stream
const output = fs.createWriteStream(outputFile);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
    console.log(
        `✓ Extension packaged: ${outputFile} (${archive.pointer()} bytes)`
    );
});

archive.on("error", (err) => {
    throw err;
});

archive.pipe(output);

// Add files
filesToInclude.forEach((file) => {
    const fullPath = path.join(__dirname, "..", file);
    if (fs.existsSync(fullPath)) {
        if (fs.statSync(fullPath).isDirectory()) {
            archive.directory(fullPath, file);
        } else {
            archive.file(fullPath, { name: file });
        }
    }
});

archive.finalize();
