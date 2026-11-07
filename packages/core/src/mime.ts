export * as Mime from "./mime.js"

export function detect(bytes: Uint8Array) {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png"
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg"
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "image/gif"
  if (startsWith(bytes, [0x42, 0x4d])) return "image/bmp"
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46])) {
    const form = ascii(bytes, 8, 12)
    if (form === "WEBP") return "image/webp"
    if (form === "WAVE") return "audio/wav"
    if (form === "AVI ") return "video/x-msvideo"
  }
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === "ftyp") {
    // AVIF, HEIC, QuickTime and M4A share MP4's container; the major brand tells them apart, and generic HEIF brands
    // list `avif`/`avis` among the compatible brands that follow the minor version.
    const brand = ascii(bytes, 8, 12)
    const boxEnd = Math.min(new DataView(bytes.buffer, bytes.byteOffset).getUint32(0), bytes.length)
    const compatible = Array.from({ length: Math.floor((boxEnd - 16) / 4) }, (_, index) =>
      ascii(bytes, 16 + index * 4, 20 + index * 4),
    )
    const generic = brand === "mif1" || brand === "msf1"
    if (
      brand === "avif" ||
      brand === "avis" ||
      (generic && (compatible.includes("avif") || compatible.includes("avis")))
    )
      return "image/avif"
    if (generic || ["heic", "heix", "hevc", "hevx"].includes(brand)) return "image/heic"
    if (brand === "qt  ") return "video/quicktime"
    if (brand === "M4A ") return "audio/mp4"
    if (brand.startsWith("3gp")) return "video/3gpp"
    return "video/mp4"
  }
  if (startsWith(bytes, [0x49, 0x44, 0x33])) return "audio/mpeg" // ID3v2 tag
  // MPEG audio frame sync: eleven set bits. The layer bits are zero in ADTS (AAC) and non-zero in MP3.
  if (bytes.length >= 4 && bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0) {
    return (bytes[1]! & 0x06) === 0 ? "audio/aac" : "audio/mpeg"
  }
  if (startsWith(bytes, [0x66, 0x4c, 0x61, 0x43])) return "audio/flac" // "fLaC"
  if (startsWith(bytes, [0x4f, 0x67, 0x67, 0x53])) return oggMedia(bytes) // "OggS"
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return ebmlMedia(bytes) // EBML container
  if (ascii(bytes, 0, 4) === "FORM" && ascii(bytes, 8, 12) === "AIFF") return "audio/aiff"
  if (startsWith(bytes, [0x4d, 0x54, 0x68, 0x64])) return "audio/midi" // "MThd"
  if (startsWith(bytes, [0x46, 0x4c, 0x56, 0x01])) return "video/x-flv" // "FLV\x01"
  if (startsWith(bytes, [0x00, 0x00, 0x01, 0xba])) return "video/mpeg" // MPEG program stream
  return isText(bytes) ? "text/plain" : "application/octet-stream"
}

// The codec string in the first pages tells Ogg audio from Theora video.
function oggMedia(bytes: Uint8Array) {
  return ascii(bytes, 0, Math.min(64, bytes.length)).includes("theora") ? "video/ogg" : "audio/ogg"
}

// WebM and Matroska share EBML; the doctype name in the header distinguishes them.
function ebmlMedia(bytes: Uint8Array) {
  const header = ascii(bytes, 0, Math.min(64, bytes.length))
  if (header.includes("webm")) return "video/webm"
  if (header.includes("matroska")) return "video/x-matroska"
  return "application/octet-stream"
}

export const isTextual = (mime: string) =>
  !mime ||
  mime.startsWith("text/") ||
  mime === "application/json" ||
  mime.endsWith("+json") ||
  mime === "application/xml" ||
  mime.endsWith("+xml") ||
  mime === "application/javascript" ||
  mime === "application/x-javascript"

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end))
}

function startsWith(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((value, index) => bytes[index] === value)
}

function isText(bytes: Uint8Array) {
  if (bytes.length === 0) return true
  if (bytes.includes(0)) return false
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes, { stream: true })
  } catch {
    return false
  }
  const controls = bytes.reduce((count, byte) => count + Number(byte < 9 || (byte > 13 && byte < 32)), 0)
  return controls / bytes.length <= 0.3
}
