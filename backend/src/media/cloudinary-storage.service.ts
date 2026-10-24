import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";

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
      provider: "cloudinary",
      configured: this.isConfigured(),
      cloudName:
        process.env.CLOUDINARY_CLOUD_NAME ||
        null,
    };
  }

  async uploadImage(
    file: Express.Multer.File,
    publicId: string,
  ) {
    const {
      cloudName,
      apiKey,
      apiSecret,
    } = this.getCredentials();

    const body = new URLSearchParams({
      file: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      public_id: publicId,
      overwrite: "false",
    });

    let response: Response;

    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
        {
          method: "POST",
          headers: {
            Authorization:
              this.getBasicAuthHeader(
                apiKey,
                apiSecret,
              ),
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body,
        },
      );
    } catch (error) {
      console.error(
        "Cloudinary upload connection failed:",
        error,
      );

      throw new BadGatewayException(
        "Could not connect to Cloudinary",
      );
    }

    const data =
      (await response
        .json()
        .catch(() => ({}))) as CloudinaryUploadResponse;

    if (
      !response.ok ||
      !data.public_id ||
      !data.secure_url
    ) {
      console.error(
        "Cloudinary upload failed:",
        data.error?.message ||
          response.statusText,
      );

      throw new BadGatewayException(
        data.error?.message ||
          "Cloudinary upload failed",
      );
    }

    return {
      publicId: data.public_id,
      secureUrl: data.secure_url,
      bytes:
        typeof data.bytes === "number"
          ? data.bytes
          : file.size,
      width:
        typeof data.width === "number"
          ? data.width
          : null,
      height:
        typeof data.height === "number"
          ? data.height
          : null,
      format: data.format ?? null,
    };
  }

  async deleteImage(
    publicId: string,
  ) {
    const {
      cloudName,
      apiKey,
      apiSecret,
    } = this.getCredentials();

    const body = new URLSearchParams({
      public_id: publicId,
      invalidate: "true",
    });

    let response: Response;

    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`,
        {
          method: "POST",
          headers: {
            Authorization:
              this.getBasicAuthHeader(
                apiKey,
                apiSecret,
              ),
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body,
        },
      );
    } catch (error) {
      console.error(
        "Cloudinary delete connection failed:",
        error,
      );

      throw new BadGatewayException(
        "Could not connect to Cloudinary",
      );
    }

    const data =
      (await response
        .json()
        .catch(() => ({}))) as CloudinaryDestroyResponse;

    if (!response.ok) {
      console.error(
        "Cloudinary delete failed:",
        data.error?.message ||
          response.statusText,
      );

      throw new BadGatewayException(
        data.error?.message ||
          "Could not delete Cloudinary asset",
      );
    }

    if (
      data.result !== "ok" &&
      data.result !== "not found"
    ) {
      throw new BadGatewayException(
        "Cloudinary did not confirm asset deletion",
      );
    }

    return data.result;
  }

  private getCredentials() {
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey =
      process.env.CLOUDINARY_API_KEY;
    const apiSecret =
      process.env.CLOUDINARY_API_SECRET;

    if (
      !cloudName ||
      !apiKey ||
      !apiSecret
    ) {
      throw new ServiceUnavailableException(
        "Cloudinary storage is not configured",
      );
    }

    return {
      cloudName,
      apiKey,
      apiSecret,
    };
  }

  private getBasicAuthHeader(
    apiKey: string,
    apiSecret: string,
  ) {
    return `Basic ${Buffer.from(
      `${apiKey}:${apiSecret}`,
    ).toString("base64")}`;
  }
}
