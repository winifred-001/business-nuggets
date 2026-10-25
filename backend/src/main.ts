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

  const trustedProxyHops =
    Number.parseInt(
      process.env
        .TRUST_PROXY_HOPS ??
        "0",
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

  const allowedOrigins = new Set([
    "http://localhost:3000",
    "https://business-nuggets-theta.vercel.app",
    "https://business-nuggets-chioms.vercel.app",
    "https://business-nuggets-git-main-chioms.vercel.app",
    ...configuredOrigins,
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
    "API docs available at /docs",
  );
}

void bootstrap();
