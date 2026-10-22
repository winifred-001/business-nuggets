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

  const allowedOrigins =
    [
      "http://localhost:3000",

      process.env
        .FRONTEND_URL,
    ].filter(
      Boolean,
    ) as string[];

  app.enableCors({
    origin:
      allowedOrigins,

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
}

void bootstrap();