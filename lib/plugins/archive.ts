import { inflateRawSync } from "zlib";

export type PluginArchiveFileRef = {
  path: string;
  sizeBytes: number;
};

export type PluginArchiveEntry = PluginArchiveFileRef & {
  compressedSizeBytes: number;
  compressionMethod: number;
  crc32: number;
  data: Buffer;
  isDirectory: boolean;
};

export type PluginArchiveSourceEntry = {
  path: string;
  data: string | Buffer;
};

const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const FIXED_DOS_TIME = 0;
const FIXED_DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
const CRC32_TABLE = buildCrc32Table();

export function hasPathTraversal(path: string): boolean {
  const normalized = normalizeArchivePath(path);
  return normalized.includes("../") || normalized.startsWith("/");
}

export function validateArchiveFileRefs(files: PluginArchiveFileRef[]): string[] {
  const errors: string[] = [];

  for (const file of files) {
    if (hasPathTraversal(file.path)) {
      errors.push(`Path traversal is not allowed: ${file.path}`);
    }
    if (file.sizeBytes < 0) {
      errors.push(`Invalid file size for ${file.path}`);
    }
  }

  return errors;
}

export function normalizeArchivePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

export function listArchiveFileRefs(entries: PluginArchiveEntry[]): PluginArchiveFileRef[] {
  return entries.map((entry) => ({
    path: entry.path,
    sizeBytes: entry.sizeBytes,
  }));
}

export function findArchiveEntry(entries: PluginArchiveEntry[], path: string): PluginArchiveEntry | undefined {
  const normalized = normalizeArchivePath(path);
  return entries.find((entry) => entry.path === normalized);
}

export function parsePluginArchive(buffer: Buffer): PluginArchiveEntry[] {
  const eocdOffset = findEndOfCentralDirectoryOffset(buffer);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);

  const entries: PluginArchiveEntry[] = [];
  let cursor = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (buffer.readUInt32LE(cursor) !== ZIP_CENTRAL_DIRECTORY_HEADER) {
      throw new Error("Invalid central directory header in plugin archive.");
    }

    const generalPurposeFlag = buffer.readUInt16LE(cursor + 8);
    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const crc32 = buffer.readUInt32LE(cursor + 16);
    const compressedSizeBytes = buffer.readUInt32LE(cursor + 20);
    const sizeBytes = buffer.readUInt32LE(cursor + 24);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraFieldLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const fileNameStart = cursor + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileNameBuffer = buffer.subarray(fileNameStart, fileNameEnd);
    const useUtf8 = (generalPurposeFlag & 0x0800) !== 0;
    const filePath = normalizeArchivePath(fileNameBuffer.toString(useUtf8 ? "utf8" : "latin1"));
    const isDirectory = filePath.endsWith("/");

    if (buffer.readUInt32LE(localHeaderOffset) !== ZIP_LOCAL_FILE_HEADER) {
      throw new Error(`Invalid local file header for archive entry ${filePath}.`);
    }

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraFieldLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
    const compressedEnd = dataStart + compressedSizeBytes;
    const compressedData = buffer.subarray(dataStart, compressedEnd);
    const data = decompressArchiveEntry(compressionMethod, compressedData, filePath);

    if (!isDirectory && data.length !== sizeBytes) {
      throw new Error(`Archive entry ${filePath} reported ${sizeBytes} bytes but extracted ${data.length} bytes.`);
    }

    entries.push({
      path: filePath,
      sizeBytes,
      compressedSizeBytes,
      compressionMethod,
      crc32,
      data,
      isDirectory,
    });

    cursor = fileNameEnd + extraFieldLength + commentLength;
  }

  return entries;
}

export function createPluginArchiveBuffer(entries: PluginArchiveSourceEntry[]): Buffer {
  const normalizedEntries = [...entries]
    .map((entry) => {
      const normalizedPath = normalizeArchivePath(entry.path);
      if (!normalizedPath.length) {
        throw new Error("Archive entry path cannot be empty.");
      }
      if (hasPathTraversal(normalizedPath)) {
        throw new Error(`Archive entry path is not allowed: ${entry.path}`);
      }
      return {
        path: normalizedPath,
        data: Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, "utf8"),
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));

  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of normalizedEntries) {
    const fileName = Buffer.from(entry.path, "utf8");
    const crc32 = computeCrc32(entry.data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(ZIP_LOCAL_FILE_HEADER, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(FIXED_DOS_TIME, 10);
    localHeader.writeUInt16LE(FIXED_DOS_DATE, 12);
    localHeader.writeUInt32LE(crc32, 14);
    localHeader.writeUInt32LE(entry.data.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, fileName, entry.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(ZIP_CENTRAL_DIRECTORY_HEADER, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(FIXED_DOS_TIME, 12);
    centralHeader.writeUInt16LE(FIXED_DOS_DATE, 14);
    centralHeader.writeUInt32LE(crc32, 16);
    centralHeader.writeUInt32LE(entry.data.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, fileName);
    offset += localHeader.length + fileName.length + entry.data.length;
  }

  const centralDirectoryBuffer = Buffer.concat(centralParts);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(ZIP_END_OF_CENTRAL_DIRECTORY, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(normalizedEntries.length, 8);
  endOfCentralDirectory.writeUInt16LE(normalizedEntries.length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectoryBuffer.length, 12);
  endOfCentralDirectory.writeUInt32LE(offset, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectoryBuffer, endOfCentralDirectory]);
}

function findEndOfCentralDirectoryOffset(buffer: Buffer): number {
  const minOffset = Math.max(0, buffer.length - 65557);

  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === ZIP_END_OF_CENTRAL_DIRECTORY) {
      return offset;
    }
  }

  throw new Error("End of central directory record not found in plugin archive.");
}

function decompressArchiveEntry(compressionMethod: number, compressedData: Buffer, path: string): Buffer {
  if (compressionMethod === 0) {
    return Buffer.from(compressedData);
  }

  if (compressionMethod === 8) {
    return inflateRawSync(compressedData);
  }

  throw new Error(`Archive entry ${path} uses unsupported compression method ${compressionMethod}.`);
}

function buildCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let round = 0; round < 8; round += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
}

function computeCrc32(buffer: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}
