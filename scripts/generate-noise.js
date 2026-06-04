#!/usr/bin/env node
/**
 * Generate 5 grayscale-noise PNGs (256×256, 8-bit, color type 0) at
 * public/grain/noise-1.png .. noise-5.png — used by `<Grain />` as
 * keyframes of an animated film-grain overlay.
 *
 * Zero dependencies. PNG bytes are emitted by hand: IHDR + IDAT (zlib
 * deflate over filter-byte-prefixed raw scanlines) + IEND. The chunk
 * CRC32 is computed against the chunk type + data per the PNG spec.
 *
 * Run with: pnpm generate:noise
 */
"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SIZE = 256;
const COUNT = 5;
const OUT_DIR = path.join(__dirname, "..", "public", "grain");

// CRC32 table (PNG uses the standard IEEE polynomial 0xedb88320).
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makeNoisePng() {
  // IHDR: width, height, bit depth, color type, compression, filter, interlace
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 0; // colour type 0 = grayscale (no alpha)
  ihdr[10] = 0; // deflate compression
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // Raw image: SIZE scanlines, each prefixed with a filter byte (0 = None).
  const raw = Buffer.alloc((SIZE + 1) * SIZE);
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE + 1)] = 0;
    for (let x = 0; x < SIZE; x++) {
      raw[y * (SIZE + 1) + 1 + x] = (Math.random() * 256) | 0;
    }
  }
  const idat = zlib.deflateSync(raw);

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (let i = 1; i <= COUNT; i++) {
  const file = path.join(OUT_DIR, `noise-${i}.png`);
  fs.writeFileSync(file, makeNoisePng());
  console.log(`✓ ${path.relative(process.cwd(), file)}`);
}
console.log(`Done — ${COUNT} PNGs (${SIZE}×${SIZE}) in ${OUT_DIR}`);
