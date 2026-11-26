import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { MEDIA_FORMATS, resourceType } from './media-types';
import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

type CloudinaryUploadResponse = {
  public_id?: string;
  secure_url?: string;
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
  error?: {
    message?: string;
  };
};

type CloudinaryDestroyResponse = {
  result?: string;
  error?: {
    message?: string;
  };
};

@Injectable()
export class CloudinaryStorageService {
  isConfigured() {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
    );
  }

  getPublicStatus() {
    return {
      provider: 'cloudinary',
      configured: this.isConfigured(),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
    };
  }

  async uploadMedia(file: Express.Multer.File, publicId: string) {
    const { cloudName, apiKey, apiSecret } = this.getCredentials();

    const body = new URLSearchParams({
      file: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      public_id: publicId,
      overwrite: 'false',
    });

    let response: Response;

    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType(file.mimetype)}/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: this.getBasicAuthHeader(apiKey, apiSecret),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        },
      );
    } catch (error) {
      console.error('Cloudinary upload connection failed:', error);

      throw new BadGatewayException('Could not connect to Cloudinary');
    }

    const data = (await response
      .json()
      .catch(() => ({}))) as CloudinaryUploadResponse;

    if (!response.ok || !data.public_id || !data.secure_url) {
      console.error(
        'Cloudinary upload failed:',
        data.error?.message || response.statusText,
      );

      throw new BadGatewayException(
        data.error?.message || 'Cloudinary upload failed',
      );
    }

    return {
      publicId: data.public_id,
      secureUrl: data.secure_url,
      bytes: typeof data.bytes === 'number' ? data.bytes : file.size,
      width: typeof data.width === 'number' ? data.width : null,
      height: typeof data.height === 'number' ? data.height : null,
      format: data.format ?? null,
    };
  }

  async deleteMedia(publicId: string, type: 'image' | 'video' = 'image') {
    const { cloudName, apiKey, apiSecret } = this.getCredentials();

    const body = new URLSearchParams({
      public_id: publicId,
      invalidate: 'true',
    });

    let response: Response;

    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${type}/destroy`,
        {
          method: 'POST',
          headers: {
            Authorization: this.getBasicAuthHeader(apiKey, apiSecret),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        },
      );
    } catch (error) {
      console.error('Cloudinary delete connection failed:', error);

      throw new BadGatewayException('Could not connect to Cloudinary');
    }

    const data = (await response
      .json()
      .catch(() => ({}))) as CloudinaryDestroyResponse;

    if (!response.ok) {
      console.error(
        'Cloudinary delete failed:',
        data.error?.message || response.statusText,
      );

      throw new BadGatewayException(
        data.error?.message || 'Could not delete Cloudinary asset',
      );
    }

    if (data.result !== 'ok' && data.result !== 'not found') {
      throw new BadGatewayException(
        'Cloudinary did not confirm asset deletion',
      );
    }

    return data.result;
  }

  createUploadSignature(payload: {
    publicId: string;
    mimeType: string;
    originalName: string;
    folderId: number | null;
  }) {
    const { cloudName, apiKey, apiSecret } = this.getCredentials();
    const fields: Record<string, string> = {
      allowed_formats: MEDIA_FORMATS[payload.mimeType],
      overwrite: 'false',
      public_id: payload.publicId,
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    const serialized = Object.keys(fields)
      .sort()
      .map((key) => `${key}=${fields[key]}`)
      .join('&');
    const signature = createHash('sha256')
      .update(serialized + apiSecret)
      .digest('hex');
    const encoded = Buffer.from(
      JSON.stringify({ ...payload, expiresAt: Date.now() + 60 * 60 * 1000 }),
    ).toString('base64url');
    const token = `${encoded}.${createHmac('sha256', apiSecret).update(encoded).digest('base64url')}`;
    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType(payload.mimeType)}/upload`,
      fields: { ...fields, signature, api_key: apiKey },
      token,
    };
  }

  verifyUploadToken(token: string): {
    publicId: string;
    mimeType: string;
    originalName: string;
    folderId: number | null;
  } {
    const { apiSecret } = this.getCredentials();
    const parts = token.split('.');
    if (parts.length !== 2)
      throw new BadRequestException('Invalid upload session');
    const expected = createHmac('sha256', apiSecret).update(parts[0]).digest();
    const received = Buffer.from(parts[1], 'base64url');
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    )
      throw new BadRequestException('Invalid upload session');
    let data;
    try {
      data = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    } catch {
      throw new BadRequestException('Invalid upload session');
    }
    if (
      !data ||
      typeof data.expiresAt !== 'number' ||
      data.expiresAt < Date.now() ||
      !data.publicId?.startsWith('business-nuggets/media/') ||
      !MEDIA_FORMATS[data.mimeType]
    )
      throw new BadRequestException('Upload session has expired or is invalid');
    return data;
  }

  async inspectUploadedMedia(publicId: string, mimeType: string) {
    const { cloudName, apiKey, apiSecret } = this.getCredentials();
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/${resourceType(mimeType)}/upload/${encodeURIComponent(publicId)}`,
      {
        headers: { Authorization: this.getBasicAuthHeader(apiKey, apiSecret) },
        signal: AbortSignal.timeout(30000),
      },
    );
    const data = (await response.json()) as CloudinaryUploadResponse & {
      video?: unknown;
      resource_type?: string;
    };
    if (
      !response.ok ||
      data.public_id !== publicId ||
      !data.secure_url ||
      !data.bytes ||
      !data.format ||
      !MEDIA_FORMATS[mimeType].split(',').includes(data.format) ||
      (mimeType.startsWith('audio/') && data.video)
    )
      throw new BadRequestException(
        'Cloudinary could not verify a supported media file',
      );
    return {
      publicId,
      secureUrl: data.secure_url,
      bytes: data.bytes,
      width: data.width ?? null,
      height: data.height ?? null,
    };
  }

  private getCredentials() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Cloudinary storage is not configured',
      );
    }

    return {
      cloudName,
      apiKey,
      apiSecret,
    };
  }

  private getBasicAuthHeader(apiKey: string, apiSecret: string) {
    return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
  }
}
