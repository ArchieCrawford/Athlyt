const fs = require("fs");
const path = require("path");

const ICON_PATH = path.resolve(__dirname, "..", "assets", "icon.png");

const errorOut = (message) => {
  console.error(`\n[verify-icons] ${message}`);
  process.exit(1);
};

const readPngInfo = (filePath) => {
  const data = fs.readFileSync(filePath);
  const signature = data.slice(0, 8);
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  if (!signature.equals(pngSignature)) {
    errorOut(`Icon is not a valid PNG: ${filePath}`);
  }

  let offset = 8;
  let width = null;
  let height = null;
  let colorType = null;
  let hasTRNS = false;

  while (offset + 8 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + length;

    if (chunkEnd + 4 > data.length) {
      break;
    }

    if (type === "IHDR") {
      width = data.readUInt32BE(chunkStart);
      height = data.readUInt32BE(chunkStart + 4);
      colorType = data.readUInt8(chunkStart + 9);
    }

    if (type === "tRNS") {
      hasTRNS = true;
    }

    offset = chunkEnd + 4;
  }

  if (width === null || height === null || colorType === null) {
    errorOut(`Missing IHDR chunk in icon PNG: ${filePath}`);
  }

  return { width, height, colorType, hasTRNS };
};

if (!fs.existsSync(ICON_PATH)) {
  errorOut(`Icon file not found at ${ICON_PATH}`);
}

const { width, height, colorType, hasTRNS } = readPngInfo(ICON_PATH);

if (width !== 1024 || height !== 1024) {
  errorOut(`Icon must be 1024x1024. Found ${width}x${height}.`);
}

const hasAlpha = colorType === 4 || colorType === 6 || hasTRNS;
if (hasAlpha) {
  errorOut("Icon has transparency. Remove alpha channel for App Store compliance.");
}

console.log(`[verify-icons] OK: ${ICON_PATH} is 1024x1024 and has no alpha.`);
