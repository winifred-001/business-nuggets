type OpenApiDocument = {
  tags?: Array<{ name: string; [key: string]: unknown }>;
  paths?: Record<string, Record<string, unknown>>;
};

const bearerSecurity = [{ bearerAuth: [] }];

const pathParam = (
  name: string,
  type: "string" | "integer" = "string",
) => ({
  name,
  in: "path",
  required: true,
  schema: { type },
});

const jsonBody = (
  schema: Record<string, unknown>,
) => ({
  required: true,
  content: {
    "application/json": {
      schema,
    },
  },
});

const protectedResponses = (
  description = "Success",
) => ({
  "200": { description },
  "401": { description: "Unauthorized" },
  "403": { description: "Forbidden" },
});

/**
 * Adds the small set of routes that live in controllers outside the main
 * OpenAPI map. Keeping these additions isolated makes it easier to audit
 * controller coverage without adding a Swagger runtime dependency.
 */
export function applyOpenApiSupplement(
  document: OpenApiDocument,
) {
  document.tags ??= [];
  document.paths ??= {};

  if (
    !document.tags.some(
      (tag) => tag.name === "Health",
    )
  ) {
    document.tags.push({ name: "Health" });
  }

  document.paths["/health/email"] = {
    get: {
      tags: ["Health"],
      summary: "Get email delivery service status",
      responses: {
        "200": {
          description: "Email delivery status",
        },
      },
    },
  };

  document.paths["/push-notifications/device"] = {
    post: {
      tags: ["Push Notifications"],
      summary: "Register a device push token",
      security: bearerSecurity,
      requestBody: jsonBody({
        type: "object",
        required: ["token", "platform"],
        properties: {
          token: { type: "string" },
          platform: {
            type: "string",
            enum: ["web", "android", "ios"],
          },
          deviceName: {
            type: "string",
            maxLength: 100,
          },
        },
      }),
      responses: protectedResponses(
        "Device registered",
      ),
    },
    delete: {
      tags: ["Push Notifications"],
      summary: "Unregister a device push token",
      security: bearerSecurity,
      requestBody: jsonBody({
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string" },
        },
      }),
      responses: protectedResponses(
        "Device unregistered",
      ),
    },
  };

  document.paths["/admin/roles"] = {
    get: {
      tags: ["Admin - Roles"],
      summary: "List the admin team and role access information",
      security: bearerSecurity,
      responses: protectedResponses(
        "Admin roles and team",
      ),
    },
  };

  document.paths[
    "/admin/roles/promotable-users"
  ] = {
    get: {
      tags: ["Admin - Roles"],
      summary: "List users who can be promoted to admin",
      security: bearerSecurity,
      responses: protectedResponses(
        "Promotable users",
      ),
    },
  };

  document.paths[
    "/admin/roles/permissions"
  ] = {
    patch: {
      tags: ["Admin - Roles"],
      summary: "Update a role permission",
      description:
        "Requires manageAdmins permission. Only a Super Admin can change role permissions.",
      security: bearerSecurity,
      requestBody: jsonBody({
        type: "object",
        required: [
          "role",
          "permission",
          "enabled",
        ],
        properties: {
          role: { type: "string" },
          permission: { type: "string" },
          enabled: { type: "boolean" },
        },
      }),
      responses: protectedResponses(
        "Role permission updated",
      ),
    },
  };

  document.paths[
    "/admin/roles/users/{id}/promote"
  ] = {
    patch: {
      tags: ["Admin - Roles"],
      summary: "Promote a user to an admin role",
      security: bearerSecurity,
      parameters: [pathParam("id", "integer")],
      requestBody: jsonBody({
        type: "object",
        required: ["adminRole"],
        properties: {
          adminRole: {
            type: "string",
            enum: [
              "super-admin",
              "editor",
              "moderator",
              "support",
            ],
          },
        },
      }),
      responses: protectedResponses(
        "User promoted",
      ),
    },
  };

  document.paths[
    "/admin/roles/admins/{id}"
  ] = {
    patch: {
      tags: ["Admin - Roles"],
      summary: "Update an admin account",
      security: bearerSecurity,
      parameters: [pathParam("id", "integer")],
      requestBody: jsonBody({
        type: "object",
        properties: {
          adminRole: {
            type: "string",
            enum: [
              "super-admin",
              "editor",
              "moderator",
              "support",
            ],
          },
          accountStatus: {
            type: "string",
            enum: ["active", "suspended"],
          },
        },
      }),
      responses: protectedResponses(
        "Admin updated",
      ),
    },
  };

  document.paths[
    "/admin/roles/admins/{id}/demote"
  ] = {
    patch: {
      tags: ["Admin - Roles"],
      summary: "Remove an admin's elevated access",
      security: bearerSecurity,
      parameters: [pathParam("id", "integer")],
      responses: protectedResponses(
        "Admin demoted",
      ),
    },
  };

  return document;
}
