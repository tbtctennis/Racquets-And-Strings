import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import exifr from 'exifr';

import { stripGpsExif, stripGpsFromImageBytes } from '../../src/features/tasks/stripGpsExif.ts';

const TORONTO_LAT = 43.6761;
const TORONTO_LNG = -79.3902;

function concatBytes(parts) {
  let total = 0;
  for (const part of parts) total += part.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function encodeJpegSegment(marker, payload) {
  const length = payload.length + 2;
  const out = new Uint8Array(2 + length);
  out[0] = 0xff;
  out[1] = marker;
  out[2] = (length >> 8) & 0xff;
  out[3] = length & 0xff;
  out.set(payload, 4);
  return out;
}

function fromHex(hex) {
  return Uint8Array.from(hex.match(/../g).map((b) => parseInt(b, 16)));
}

// Minimal 1×1 SOF0 JPEG body (no APP segments). Parsers that only walk markers accept it.
function jpegBody() {
  const quant = '08'.repeat(64);
  return fromHex(
    `ffdb004300${quant}ffc0000b080001000101011100ffc40014000100000000000000000000000000000003ffc40014100100000000000000000000000000000000ffda0008010100003f003fffd9`,
  );
}

function toDmsRationals(decimal) {
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutesFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;
  return [
    [degrees, 1],
    [minutes, 1],
    [Math.round(seconds * 10000), 10000],
  ];
}

function writeAsciiInline(view, offset, text) {
  view.setUint32(offset, 0, true);
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

function buildExifTiff({ latitude, longitude, orientation = 6 }) {
  const latRef = latitude >= 0 ? 'N' : 'S';
  const lonRef = longitude >= 0 ? 'E' : 'W';
  const lat = toDmsRationals(latitude);
  const lon = toDmsRationals(longitude);

  const buf = new ArrayBuffer(160);
  const view = new DataView(buf);
  const out = new Uint8Array(buf);

  view.setUint16(0, 0x4949, true); // II
  view.setUint16(2, 42, true);
  view.setUint32(4, 8, true);

  const ifd0 = 8;
  view.setUint16(ifd0, 2, true);
  // Orientation
  view.setUint16(ifd0 + 2, 0x0112, true);
  view.setUint16(ifd0 + 4, 3, true); // SHORT
  view.setUint32(ifd0 + 6, 1, true);
  view.setUint16(ifd0 + 10, orientation, true);
  view.setUint16(ifd0 + 12, 0, true);
  // GPS IFD pointer
  const gpsIfd = 38;
  view.setUint16(ifd0 + 14, 0x8825, true);
  view.setUint16(ifd0 + 16, 4, true); // LONG
  view.setUint32(ifd0 + 18, 1, true);
  view.setUint32(ifd0 + 22, gpsIfd, true);
  view.setUint32(ifd0 + 26, 0, true); // next IFD

  const latData = 92;
  const lonData = 116;
  view.setUint16(gpsIfd, 4, true);
  view.setUint16(gpsIfd + 2, 0x0001, true); // GPSLatitudeRef
  view.setUint16(gpsIfd + 4, 2, true);
  view.setUint32(gpsIfd + 6, 2, true);
  writeAsciiInline(view, gpsIfd + 10, `${latRef}\0`);
  view.setUint16(gpsIfd + 14, 0x0002, true); // GPSLatitude
  view.setUint16(gpsIfd + 16, 5, true);
  view.setUint32(gpsIfd + 18, 3, true);
  view.setUint32(gpsIfd + 22, latData, true);
  view.setUint16(gpsIfd + 26, 0x0003, true); // GPSLongitudeRef
  view.setUint16(gpsIfd + 28, 2, true);
  view.setUint32(gpsIfd + 30, 2, true);
  writeAsciiInline(view, gpsIfd + 34, `${lonRef}\0`);
  view.setUint16(gpsIfd + 38, 0x0004, true); // GPSLongitude
  view.setUint16(gpsIfd + 40, 5, true);
  view.setUint32(gpsIfd + 42, 3, true);
  view.setUint32(gpsIfd + 46, lonData, true);
  view.setUint32(gpsIfd + 50, 0, true);

  const writeRationals = (offset, triples) => {
    for (let i = 0; i < triples.length; i++) {
      view.setUint32(offset + i * 8, triples[i][0], true);
      view.setUint32(offset + i * 8 + 4, triples[i][1], true);
    }
  };
  writeRationals(latData, lat);
  writeRationals(lonData, lon);

  return out.subarray(0, 140);
}

function jpegWithGps(latitude, longitude) {
  const tiff = buildExifTiff({ latitude, longitude });
  const payload = new Uint8Array(6 + tiff.length);
  payload.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 0);
  payload.set(tiff, 6);
  return concatBytes([Uint8Array.from([0xff, 0xd8]), encodeJpegSegment(0xe1, payload), jpegBody()]);
}

function jpegWithXmpGps(latitude, longitude) {
  const xml = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:exif="http://ns.adobe.com/exif/1.0/" exif:GPSLatitude="${Math.abs(latitude)},0N" exif:GPSLongitude="${Math.abs(longitude)},0W"/></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
  const ident = 'http://ns.adobe.com/xap/1.0/\0';
  const xmlBytes = new TextEncoder().encode(xml);
  const payload = new Uint8Array(ident.length + xmlBytes.length);
  for (let i = 0; i < ident.length; i++) payload[i] = ident.charCodeAt(i);
  payload.set(xmlBytes, ident.length);
  return concatBytes([Uint8Array.from([0xff, 0xd8]), encodeJpegSegment(0xe1, payload), jpegBody()]);
}

test('a GPS-tagged court JPEG still has readable coordinates before stripping', async () => {
  const original = jpegWithGps(TORONTO_LAT, TORONTO_LNG);
  const gps = await exifr.gps(original);
  assert.ok(gps, 'fixture JPEG must carry GPS so the strip test is meaningful');
  assert.ok(Math.abs(gps.latitude - TORONTO_LAT) < 0.0002);
  assert.ok(Math.abs(gps.longitude - TORONTO_LNG) < 0.0002);
});

test('stripGpsExif removes GPS so the stored court photo bytes have no GPS', async () => {
  const original = jpegWithGps(TORONTO_LAT, TORONTO_LNG);
  const file = new File([original], 'court.jpg', { type: 'image/jpeg' });
  const stored = await stripGpsExif(file);
  const storedBytes = new Uint8Array(await stored.arrayBuffer());

  const gps = await exifr.gps(storedBytes);
  assert.equal(gps, undefined);

  const parsed = await exifr.parse(storedBytes, { gps: true, mergeOutput: false });
  assert.equal(parsed?.gps, undefined);

  const orientation = await exifr.orientation(storedBytes);
  assert.equal(orientation, 6);
});

function tiffOffset(bytes) {
  const sig = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
  for (let i = 0; i <= bytes.length - sig.length; i++) {
    if (sig.every((b, j) => bytes[i + j] === b)) return i + sig.length;
  }
  throw new Error('EXIF TIFF header not found');
}

test('stripGpsFromImageBytes zeros the GPS IFD so leftover coordinates are not sitting in the file', async () => {
  const original = jpegWithGps(TORONTO_LAT, TORONTO_LNG);
  const stripped = stripGpsFromImageBytes(original);
  assert.equal(await exifr.gps(stripped), undefined);

  // GPS IFD starts at TIFF offset 38 in the fixture. After strip it must be zeros.
  const originalGpsIfd = original.subarray(tiffOffset(original) + 38, tiffOffset(original) + 38 + 54);
  const gpsIfd = stripped.subarray(tiffOffset(stripped) + 38, tiffOffset(stripped) + 38 + 54);
  assert.ok(
    gpsIfd.every((b) => b === 0),
    'GPS IFD bytes must be overwritten, not just unlinked',
  );
  assert.ok(
    originalGpsIfd.some((b) => b !== 0),
    'fixture GPS IFD was non-zero before strip',
  );
});

test('JPEG without GPS is left unchanged', async () => {
  const original = concatBytes([Uint8Array.from([0xff, 0xd8]), jpegBody()]);
  const stripped = stripGpsFromImageBytes(original);
  assert.equal(stripped, original);
  assert.equal(await exifr.gps(stripped), undefined);
});

test('XMP GPS attributes are removed from stored JPEG bytes', async () => {
  const original = jpegWithXmpGps(TORONTO_LAT, TORONTO_LNG);
  const originalText = new TextDecoder().decode(original);
  assert.match(originalText, /exif:GPSLatitude/);
  const stripped = stripGpsFromImageBytes(original);
  const strippedText = new TextDecoder().decode(stripped);
  assert.doesNotMatch(strippedText, /exif:GPSLatitude/);
  assert.doesNotMatch(strippedText, /exif:GPSLongitude/);
});

test('court photo upload strips GPS before storing the file and does not write coordinates', async () => {
  const source = await readFile(new URL('../../src/features/tasks/photoReportService.ts', import.meta.url), 'utf8');
  assert.match(source, /stripGpsExif/);
  assert.match(source, /storedFiles = await Promise\.all\(files\.map\(stripGpsExif\)\)/);
  assert.match(source, /uploadBytesResumable\([\s\S]*storedFiles\[i\]/);
  assert.doesNotMatch(source, /exif_gps_lat/);
  assert.doesNotMatch(source, /exif_gps_lng/);
  assert.doesNotMatch(source, /exifr\.gps/);
});
