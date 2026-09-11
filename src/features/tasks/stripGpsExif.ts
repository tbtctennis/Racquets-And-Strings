import exifr from 'exifr';

const JPEG_SOI0 = 0xff;
const JPEG_SOI1 = 0xd8;
const JPEG_MARKER = 0xff;
const JPEG_SOS = 0xda;
const JPEG_EOI = 0xd9;
const JPEG_APP1 = 0xe1;
const TIFF_GPS_IFD_TAG = 0x8825;
const TIFF_MAGIC = 42;
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // Exif\0\0
const XMP_IDENT = 'http://ns.adobe.com/xap/1.0/\0';

const TIFF_TYPE_BYTES: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 1,
  7: 1,
  8: 2,
  9: 4,
  10: 8,
  11: 4,
  12: 8,
  13: 4,
};

const GPS_STRIP_FAILED = 'This photo includes location data that could not be removed. Please try a different image.';

function concatBytes(parts: Uint8Array[]): Uint8Array {
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

function startsWithBytes(bytes: Uint8Array, prefix: readonly number[], at = 0): boolean {
  if (at + prefix.length > bytes.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (bytes[at + i] !== prefix[i]) return false;
  }
  return true;
}

function startsWithString(bytes: Uint8Array, prefix: string): boolean {
  if (prefix.length > bytes.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (bytes[i] !== prefix.charCodeAt(i)) return false;
  }
  return true;
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === JPEG_SOI0 && bytes[1] === JPEG_SOI1;
}

function isPng(bytes: Uint8Array): boolean {
  return startsWithBytes(bytes, PNG_SIG);
}

function encodeJpegSegment(marker: number, payload: Uint8Array): Uint8Array {
  const length = payload.length + 2;
  const out = new Uint8Array(2 + length);
  out[0] = JPEG_MARKER;
  out[1] = marker;
  out[2] = (length >> 8) & 0xff;
  out[3] = length & 0xff;
  out.set(payload, 4);
  return out;
}

function stripGpsFromXmp(xml: string): string {
  return xml
    .replace(/<(?:exif|tiff|xmp):GPS[A-Za-z0-9]*\b[^>]*>[\s\S]*?<\/(?:exif|tiff|xmp):GPS[A-Za-z0-9]*>/gi, '')
    .replace(/<(?:exif|tiff|xmp):GPS[A-Za-z0-9]*\b[^>]*\/>/gi, '')
    .replace(/\s(?:exif|tiff|xmp):GPS[A-Za-z0-9]*="[^"]*"/gi, '');
}

function stripGpsFromTiff(tiff: Uint8Array): Uint8Array {
  if (tiff.length < 8) return tiff;
  const le = tiff[0] === 0x49 && tiff[1] === 0x49;
  const be = tiff[0] === 0x4d && tiff[1] === 0x4d;
  if (!le && !be) return tiff;

  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const u16 = (offset: number) => view.getUint16(offset, le);
  const u32 = (offset: number) => view.getUint32(offset, le);
  if (u16(2) !== TIFF_MAGIC) return tiff;

  const ifd0 = u32(4);
  if (!ifdHasGpsPointer(view, ifd0, le, tiff.length)) return tiff;

  const out = new Uint8Array(tiff);
  const outView = new DataView(out.buffer, out.byteOffset, out.byteLength);
  const writeU16 = (offset: number, value: number) => outView.setUint16(offset, value, le);
  const readU16 = (offset: number) => outView.getUint16(offset, le);
  const readU32 = (offset: number) => outView.getUint32(offset, le);

  const visited = new Set<number>();
  const stripIfd = (offset: number) => {
    if (offset < 8 || offset + 2 > out.length || visited.has(offset)) return;
    visited.add(offset);
    const count = readU16(offset);
    if (count > 512 || offset + 2 + count * 12 + 4 > out.length) return;

    let gpsEntryIndex = -1;
    let gpsIfdOffset = 0;
    for (let i = 0; i < count; i++) {
      const entry = offset + 2 + i * 12;
      if (readU16(entry) !== TIFF_GPS_IFD_TAG) continue;
      gpsEntryIndex = i;
      gpsIfdOffset = readU32(entry + 8);
      break;
    }

    if (gpsEntryIndex >= 0) {
      zeroGpsIfd(out, outView, le, gpsIfdOffset);
      const entryOffset = offset + 2 + gpsEntryIndex * 12;
      const ifdEnd = offset + 2 + count * 12 + 4;
      out.copyWithin(entryOffset, entryOffset + 12, ifdEnd);
      out.fill(0, ifdEnd - 12, ifdEnd);
      writeU16(offset, count - 1);
    }

    const nextCount = readU16(offset);
    const nextIfd = readU32(offset + 2 + nextCount * 12);
    if (nextIfd) stripIfd(nextIfd);
  };

  stripIfd(ifd0);
  return out;
}

function ifdHasGpsPointer(view: DataView, offset: number, le: boolean, length: number): boolean {
  const seen = new Set<number>();
  let current = offset;
  while (current >= 8 && current + 2 <= length && !seen.has(current)) {
    seen.add(current);
    const count = view.getUint16(current, le);
    if (count > 512 || current + 2 + count * 12 + 4 > length) return false;
    for (let i = 0; i < count; i++) {
      const entry = current + 2 + i * 12;
      if (view.getUint16(entry, le) === TIFF_GPS_IFD_TAG) return true;
    }
    current = view.getUint32(current + 2 + count * 12, le);
  }
  return false;
}

function zeroGpsIfd(out: Uint8Array, view: DataView, le: boolean, gpsOffset: number): void {
  if (gpsOffset < 8 || gpsOffset + 2 > out.length) return;
  const count = view.getUint16(gpsOffset, le);
  if (count > 512 || gpsOffset + 2 + count * 12 + 4 > out.length) return;
  for (let i = 0; i < count; i++) {
    const entry = gpsOffset + 2 + i * 12;
    const type = view.getUint16(entry + 2, le);
    const valueCount = view.getUint32(entry + 4, le);
    const size = (TIFF_TYPE_BYTES[type] ?? 1) * valueCount;
    if (size > 4) {
      const valueOffset = view.getUint32(entry + 8, le);
      if (valueOffset + size <= out.length) out.fill(0, valueOffset, valueOffset + size);
    }
  }
  out.fill(0, gpsOffset, gpsOffset + 2 + count * 12 + 4);
}

function rewriteApp1(payload: Uint8Array): Uint8Array {
  if (startsWithBytes(payload, EXIF_HEADER)) {
    const tiff = payload.subarray(EXIF_HEADER.length);
    const stripped = stripGpsFromTiff(tiff);
    if (stripped === tiff) return payload;
    const out = new Uint8Array(EXIF_HEADER.length + stripped.length);
    out.set(payload.subarray(0, EXIF_HEADER.length), 0);
    out.set(stripped, EXIF_HEADER.length);
    return out;
  }
  if (startsWithString(payload, XMP_IDENT)) {
    const xml = new TextDecoder().decode(payload.subarray(XMP_IDENT.length));
    const next = stripGpsFromXmp(xml);
    if (next === xml) return payload;
    const xmlBytes = new TextEncoder().encode(next);
    const out = new Uint8Array(XMP_IDENT.length + xmlBytes.length);
    for (let i = 0; i < XMP_IDENT.length; i++) out[i] = XMP_IDENT.charCodeAt(i);
    out.set(xmlBytes, XMP_IDENT.length);
    return out;
  }
  return payload;
}

function stripGpsFromJpeg(bytes: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  let offset = 2;
  let changed = false;

  while (offset < bytes.length) {
    if (bytes[offset] !== JPEG_MARKER) {
      parts.push(bytes.subarray(offset));
      break;
    }
    while (offset + 1 < bytes.length && bytes[offset] === JPEG_MARKER && bytes[offset + 1] === JPEG_MARKER) {
      offset += 1;
    }
    if (offset + 1 >= bytes.length) {
      parts.push(bytes.subarray(offset));
      break;
    }

    const marker = bytes[offset + 1];
    if (marker === undefined) break;
    if (marker === JPEG_SOS) {
      parts.push(bytes.subarray(offset));
      break;
    }
    if (marker === JPEG_EOI) {
      parts.push(bytes.subarray(offset, offset + 2));
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(bytes.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }
    if (offset + 4 > bytes.length) {
      parts.push(bytes.subarray(offset));
      break;
    }

    const length = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);
    const segmentEnd = offset + 2 + length;
    if (length < 2 || segmentEnd > bytes.length) {
      parts.push(bytes.subarray(offset));
      break;
    }

    if (marker === JPEG_APP1) {
      const payload = bytes.subarray(offset + 4, segmentEnd);
      const next = rewriteApp1(payload);
      if (next !== payload) {
        changed = true;
        if (next.length > 0) parts.push(encodeJpegSegment(JPEG_APP1, next));
        offset = segmentEnd;
        continue;
      }
    }

    parts.push(bytes.subarray(offset, segmentEnd));
    offset = segmentEnd;
  }

  return changed ? concatBytes(parts) : bytes;
}

function stripExifFromPng(bytes: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  let changed = false;
  while (offset + 12 <= bytes.length) {
    const length =
      ((bytes[offset] ?? 0) << 24) |
      ((bytes[offset + 1] ?? 0) << 16) |
      ((bytes[offset + 2] ?? 0) << 8) |
      (bytes[offset + 3] ?? 0);
    const chunkEnd = offset + 12 + length;
    if (length < 0 || chunkEnd > bytes.length) {
      parts.push(bytes.subarray(offset));
      break;
    }
    const type = String.fromCharCode(
      bytes[offset + 4] ?? 0,
      bytes[offset + 5] ?? 0,
      bytes[offset + 6] ?? 0,
      bytes[offset + 7] ?? 0,
    );
    if (type === 'eXIf') changed = true;
    else parts.push(bytes.subarray(offset, chunkEnd));
    offset = chunkEnd;
    if (type === 'IEND') {
      if (offset < bytes.length) parts.push(bytes.subarray(offset));
      break;
    }
  }
  return changed ? concatBytes(parts) : bytes;
}

export function stripGpsFromImageBytes(bytes: Uint8Array): Uint8Array {
  if (isJpeg(bytes)) return stripGpsFromJpeg(bytes);
  if (isPng(bytes)) return stripExifFromPng(bytes);
  return bytes;
}

function hasReadableGps(
  gps: { latitude?: number; longitude?: number } | undefined,
): gps is { latitude: number; longitude: number } {
  return Boolean(gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude));
}

// VISION §10.4: court photos store no GPS. Strip the GPS IFD (and XMP GPS) from the bytes that
// will be uploaded, then refuse the file if coordinates are still readable.
export async function stripGpsExif(file: File): Promise<File> {
  const input = new Uint8Array(await file.arrayBuffer());
  const stripped = stripGpsFromImageBytes(input);
  const gps = await exifr.gps(stripped).catch(() => undefined);
  if (hasReadableGps(gps)) throw new Error(GPS_STRIP_FAILED);
  if (stripped === input) return file;
  return new File([stripped], file.name, {
    type: file.type || 'image/jpeg',
    lastModified: file.lastModified,
  });
}
