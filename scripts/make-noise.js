// Generates the tiling CRT-snow textures used by StaticNoise.
//
// Why a generated asset instead of a grid of Views: fine-grained snow needs
// thousands of cells, and the PRD targets older Android hardware. A 96px
// tiling PNG drawn by one <Image resizeMode="repeat"> costs a single view and
// looks far closer to real static.
//
// Run: node scripts/make-noise.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 96;
const TILES = 3;

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// Greyscale + alpha (colour type 4): the tint comes from the RN layer, so the
// texture only needs luminance and coverage.
function makeTile(seed) {
  const raw = Buffer.alloc(SIZE * (SIZE * 2 + 1));
  let p = 0;
  let s = seed * 6971 + 1;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  for (let y = 0; y < SIZE; y += 1) {
    raw[p] = 0; // filter byte: none
    p += 1;
    for (let x = 0; x < SIZE; x += 1) {
      const v = rand();
      // Bias towards dark so the snow sits over black rather than washing the
      // screen out — real static is mostly dark with bright speckle.
      const lum = Math.floor(Math.pow(v, 1.6) * 255);
      raw[p] = lum;
      raw[p + 1] = Math.floor(120 + v * 135); // alpha
      p += 2;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 4; // greyscale + alpha
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'assets', 'noise');
fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < TILES; i += 1) {
  const file = path.join(outDir, `snow${i + 1}.png`);
  fs.writeFileSync(file, makeTile(i + 1));
  console.log('wrote', path.relative(process.cwd(), file));
}
