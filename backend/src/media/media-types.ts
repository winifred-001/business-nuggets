export const MEDIA_FORMATS: Record<string, string> = {
  'image/jpeg': 'jpg,jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
};
export function normalizeMime(mime: string) {
  if (mime === 'audio/mp3') return 'audio/mpeg';
  if (mime === 'audio/x-wav' || mime === 'audio/wave') return 'audio/wav';
  return mime;
}
export function mediaLimit(mime: string) {
  return (mime.startsWith('audio/') ? 50 : 10) * 1024 * 1024;
}
export function resourceType(mime: string): 'video' | 'image' {
  return mime.startsWith('audio/') ? 'video' : 'image';
}

export function detectMediaMime(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return 'image/jpeg';
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return 'image/png';
  if (
    buffer.length >= 6 &&
    ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))
  )
    return 'image/gif';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF') {
    if (buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
    if (buffer.length >= 44 && buffer.toString('ascii', 8, 12) === 'WAVE')
      return 'audio/wav';
  }
  let offset = 0;
  if (buffer.length >= 10 && buffer.toString('ascii', 0, 3) === 'ID3') {
    if (buffer.subarray(6, 10).some((byte) => byte > 127)) return null;
    offset =
      10 + (buffer[6] << 21) + (buffer[7] << 14) + (buffer[8] << 7) + buffer[9];
    if (buffer[5] & 0x10) offset += 10;
  }
  for (let i = offset; i < Math.min(buffer.length - 3, offset + 4096); i++) {
    if (buffer[i] !== 255 || (buffer[i + 1] & 224) !== 224) continue;
    const version = (buffer[i + 1] >> 3) & 3,
      layer = (buffer[i + 1] >> 1) & 3;
    const bitIndex = buffer[i + 2] >> 4,
      sampleIndex = (buffer[i + 2] >> 2) & 3;
    if (
      version === 1 ||
      layer !== 1 ||
      bitIndex === 0 ||
      bitIndex === 15 ||
      sampleIndex === 3
    )
      continue;
    const bitrate = (
      version === 3
        ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
        : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
    )[bitIndex];
    const sampleRate =
      [44100, 48000, 32000][sampleIndex] /
      (version === 3 ? 1 : version === 2 ? 2 : 4);
    const frameLength =
      Math.floor(((version === 3 ? 144000 : 72000) * bitrate) / sampleRate) +
      ((buffer[i + 2] >> 1) & 1);
    if (i + frameLength <= buffer.length) return 'audio/mpeg';
  }
  return null;
}
