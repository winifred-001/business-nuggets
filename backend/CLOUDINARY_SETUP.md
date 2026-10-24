# Cloudinary Media Storage Setup

Business Nuggets now stores new Admin Media Library uploads in Cloudinary instead of the Render filesystem.

## Why

Render's local filesystem is not suitable for persistent user uploads. Cloudinary stores the files remotely and delivers them over HTTPS/CDN.

## Required Render environment variables

Add these values to the backend service in Render:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Get the values from the Cloudinary Console/API Keys page.

Do not put `CLOUDINARY_API_SECRET` in the frontend, Vercel public environment variables, browser code, screenshots, or source control.

## Optional Media Library storage display value

The Admin Media Library still shows an approximate storage budget. You can control that display with:

```env
MEDIA_STORAGE_LIMIT_BYTES=21474836480
```

The default is 20 GB when the variable is omitted. This value is a Business Nuggets UI budget and is not a Cloudinary billing/plan limit.

## Upload flow

1. Admin selects an image in Admin Console > Media Library.
2. NestJS receives the file with Multer memory storage.
3. The backend sends the file to Cloudinary's authenticated Upload API over HTTPS.
4. Cloudinary returns the secure URL, public ID, dimensions, and final byte size.
5. Business Nuggets saves the metadata in `MediaAsset`.
6. The Media Library displays the Cloudinary asset through the existing `/media/...` delivery path, which redirects to the Cloudinary CDN.

Supported image types remain:

- JPEG
- PNG
- WEBP
- GIF

Maximum upload size remains 10 MB per image.

## Delete flow

Deleting a Cloudinary-backed Media Library asset first calls Cloudinary's authenticated destroy endpoint. The database record is deleted only after the remote delete succeeds (or Cloudinary reports the file is already missing).

Older media records created before Cloudinary remain backward-compatible with the old local `/media/:filename` route where the physical file still exists.

## No new npm dependency

The integration uses Cloudinary's authenticated HTTPS Upload API directly through Node's built-in `fetch`, so there is no Cloudinary SDK/package-lock change required.

## Deployment checklist

- Add the three required `CLOUDINARY_*` variables to Render.
- Save and deploy the latest backend commit.
- Sign in to the Admin Console.
- Open Media Library.
- Upload a small JPG/PNG/WEBP/GIF.
- Confirm the image appears after refresh.
- Restart/redeploy the backend and confirm the image still appears.
- Delete the image and confirm it disappears from both Business Nuggets and Cloudinary Media Library.
