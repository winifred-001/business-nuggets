import "dotenv/config";

import {
  ValidationPipe,
} from "@nestjs/common";

import {
  NestFactory,
} from "@nestjs/core";

import helmet from "helmet";

import {
  AppModule,
} from "./app.module";

import {
  createOpenApiDocument,
  docsHtml,
} from "./docs/openapi";

import {
  applyOpenApiSupplement,
} from "./docs/openapi-supplement";

async function bootstrap() {
  const app =
    await NestFactory.create(
      AppModule,
      {
        rawBody: true,
      },
    );

  /* =========================================================
     TRUSTED PROXY
  ========================================================= */

  const expressApp =
    app
      .getHttpAdapter()
      .getInstance();

  const defaultTrustedProxyHops =
    process.env.RENDER_EXTERNAL_URL
      ? "1"
      : "0";

  const trustedProxyHops =
    Number.parseInt(
      process.env
        .TRUST_PROXY_HOPS ??
        defaultTrustedProxyHops,
      10,
    );

  if (
    Number.isFinite(
      trustedProxyHops,
    ) &&
    trustedProxyHops > 0
  ) {
    expressApp.set(
      "trust proxy",
      trustedProxyHops,
    );
  }

  /* =========================================================
     SECURITY HEADERS
  ========================================================= */

  app.use(
    helmet(),
  );

  /* =========================================================
     REQUEST VALIDATION
  ========================================================= */

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:
        true,

      transform:
        true,

      forbidNonWhitelisted:
        true,
    }),
  );

  /* =========================================================
     CORS
  ========================================================= */

  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS ?? "")
      .split(",")
      .map((origin) => origin.trim()),
  ].filter(Boolean) as string[];

  const apiOrigins = [
    process.env.RENDER_EXTERNAL_URL,
    process.env.BACKEND_URL,
    process.env.API_URL,
  ].filter(Boolean) as string[];

  const allowedOrigins = new Set([
    "http://localhost:3000",
    "https://business-nuggets-theta.vercel.app",
    "https://business-nuggets-chioms.vercel.app",
    "https://business-nuggets-git-main-chioms.vercel.app",
    "https://business-nuggets-api.onrender.com",
    ...configuredOrigins,
    ...apiOrigins,
  ]);

  const businessNuggetsDeploymentOrigin =
    /^https:\/\/business-nuggets(?:-[a-z0-9-]+)?-chioms\.vercel\.app$/i;

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (
        error: Error | null,
        allow?: boolean,
      ) => void,
    ) => {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        businessNuggetsDeploymentOrigin.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          "Origin not allowed by CORS",
        ),
      );
    },

    credentials:
      true,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  });

  /* =========================================================
     API DOCS
  ========================================================= */

  const apiDocsEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_API_DOCS === "true";

  if (apiDocsEnabled) {
    expressApp.get(
      "/docs/openapi.json",
      (_req: any, res: any) => {
        const document =
          applyOpenApiSupplement(
            createOpenApiDocument(),
          );

        res
          .status(200)
          .type("application/json")
          .send(document);
      },
    );

    expressApp.get(
      "/docs",
      (_req: any, res: any) => {
        res
          .status(200)
          .set(
            "Content-Security-Policy",
            "default-src 'self'; style-src 'self' 'unsafe-inline' https://unpkg.com; script-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; font-src 'self' data: https://unpkg.com; connect-src 'self'",
          )
          .type("html")
          .send(docsHtml);
      },
    );
  }

  /* =========================================================
     SERVER
  ========================================================= */

  const port =
    Number(
      process.env.PORT ??
      3001,
    );

  await app.listen(
    port,
    "0.0.0.0",
  );

  console.log(
    `Business Nuggets API running on port ${port}`,
  );

  console.log(
    apiDocsEnabled
      ? "API docs available at /docs"
      : "API docs disabled",
  );
}

void bootstrap();
