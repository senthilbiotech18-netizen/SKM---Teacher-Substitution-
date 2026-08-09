import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // Simple uncompressed/deflated raw RGBA PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk (raw RGBA pixels)
  const lineSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * lineSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * lineSize;
    rawData[rowOffset] = 0; // Filter type 0: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Rounded corner check
      const cornerRadius = width * 0.22;
      let isCorner = false;
      let dx = 0, dy = 0;
      if (x < cornerRadius) dx = cornerRadius - x;
      else if (x > width - cornerRadius) dx = x - (width - cornerRadius);
      if (y < cornerRadius) dy = cornerRadius - y;
      else if (y > height - cornerRadius) dy = y - (height - cornerRadius);

      if (dx * dx + dy * dy > cornerRadius * cornerRadius) {
        // Transparent corner
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      } else {
        // App brand color #534ab7 (RGB: 83, 74, 183)
        // With white icon design in middle
        const cx = width / 2;
        const cy = height / 2;
        const distToCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

        if (distToCenter < width * 0.28) {
          // White center symbol
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = 255;
        }
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// CRC32 implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

fs.writeFileSync('public/icon-192.png', createPng(192, 192, 83, 74, 183));
fs.writeFileSync('public/icon-512.png', createPng(512, 512, 83, 74, 183));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180, 83, 74, 183));
console.log('PNG Icons generated successfully in /public');
