import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
/**
 * S3-compatible file storage abstraction.
 *
 * Default driver: "local" — files are written under ./uploads on the server's
 * disk and served back through the app's /api/files route.
 *
 * Driver "s3" wires up the AWS SDK v3 S3 client from env vars. It is
 * configured but UNTESTED (no live bucket was available during development).
 * See README "Feature Status".
 */

export interface StoredFile {
  /** Opaque key used to retrieve the file later. */
  key: string;
  /** Original file name supplied by the uploader. */
  originalName: string;
  /** MIME type. */
  mimeType: string;
  /** Size in bytes. */
  size: number;
}

export interface StorageDriver {
  upload(buffer: Buffer, opts: { originalName: string; mimeType: string }): Promise<StoredFile>;
  /** Returns file bytes + metadata, or null if missing. */
  download(key: string): Promise<{ buffer: Buffer; mimeType: string; originalName: string } | null>;
  delete(key: string): Promise<void>;
  /** Public URL hint shown in the UI (may be a download route). */
  fileUrl(key: string): string;
}

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function sanitise(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

class LocalDiskDriver implements StorageDriver {
  async upload(buffer: Buffer, opts: { originalName: string; mimeType: string }): Promise<StoredFile> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const key = `${randomUUID()}-${sanitise(opts.originalName)}`;
    await fs.writeFile(path.join(UPLOAD_DIR, key), buffer);
    return { key, originalName: opts.originalName, mimeType: opts.mimeType, size: buffer.length };
  }

  async download(key: string) {
    if (key.includes("..") || path.basename(key) !== key) return null;
    try {
      const buffer = await fs.readFile(path.join(UPLOAD_DIR, key));
      // Recover original name/mime from the key suffix; exact originals are
      // stored in the DB (Profile.resumeName) for the download header.
      const originalName = key.slice(37);
      return { buffer, mimeType: "application/pdf", originalName };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (key.includes("..") || path.basename(key) !== key) return;
    await fs.rm(path.join(UPLOAD_DIR, key), { force: true });
  }

  fileUrl(key: string): string {
    return `/api/files/${encodeURIComponent(key)}`;
  }
}

// ---- S3 driver (configured, UNTESTED) -------------------------------------

let s3Client: S3Client | null = null;

function getS3(): { client: S3Client; bucket: string } {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not set");
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.S3_REGION || "ap-south-1",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
      credentials:
        process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }
  return { client: s3Client, bucket };
}

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const readable = stream as AsyncIterable<Uint8Array>;
  for await (const chunk of readable) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

class S3Driver implements StorageDriver {
  async upload(buffer: Buffer, opts: { originalName: string; mimeType: string }): Promise<StoredFile> {
    const { client, bucket } = getS3();
    const key = `resumes/${randomUUID()}-${sanitise(opts.originalName)}`;
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: opts.mimeType })
    );
    return { key, originalName: opts.originalName, mimeType: opts.mimeType, size: buffer.length };
  }

  async download(key: string) {
    const { client, bucket } = getS3();
    try {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!res.Body) return null;
      const buffer = await streamToBuffer(res.Body);
      return {
        buffer,
        mimeType: res.ContentType || "application/octet-stream",
        originalName: path.basename(key),
      };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const { client, bucket } = getS3();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  fileUrl(key: string): string {
    const pub = process.env.S3_PUBLIC_URL;
    if (pub) return `${pub.replace(/\/$/, "")}/${key}`;
    return `/api/files/${encodeURIComponent(key)}`;
  }
}

// ---------------------------------------------------------------------------

const driverName = (process.env.STORAGE_DRIVER || "local").toLowerCase();

export const storage: StorageDriver = driverName === "s3" ? new S3Driver() : new LocalDiskDriver();

export const STORAGE_DRIVER_NAME = driverName;

/** PDF-only guard used by the resume upload route. */
export const RESUME_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function isPdf(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.subarray(0, 4).toString("ascii") === "%PDF";
}
