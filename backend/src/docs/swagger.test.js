// chạy npx jest src/docs/swagger.test.js


const swaggerSpec = require("./swagger");

describe("swaggerSpec", () => {
    const getPath = (path, method) => swaggerSpec.paths?.[path]?.[method];
    const getSchemaRef = (obj) =>
        obj?.content?.["application/json"]?.schema?.$ref;

    it("should define OpenAPI metadata", () => {
        expect(swaggerSpec.openapi).toBe("3.0.0");
        expect(swaggerSpec.info.title).toBe("NguyenLien API");
        expect(swaggerSpec.info.version).toBe("1.0.0");
        expect(swaggerSpec.servers).toEqual([{ url: "http://localhost:5000" }]);
    });

    it("should define security schemes", () => {
        expect(swaggerSpec.components.securitySchemes.bearerAuth).toMatchObject({
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
        });

        expect(swaggerSpec.components.securitySchemes.refreshTokenCookie).toMatchObject({
            type: "apiKey",
            in: "cookie",
            name: "refreshToken",
        });
    });

    it("should define shared response schemas", () => {
        expect(swaggerSpec.components.schemas.ErrorResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.LoginSuccessResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.RegisterSuccessResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.RefreshSuccessResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.LogoutSuccessResponse).toBeDefined();
    });

    it("should define auth register endpoint correctly", () => {
        const route = getPath("/api/v1/auth/register", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Auth");
        expect(route.security).toEqual([]);

        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/RegisterInput");
        expect(route.responses["201"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/RegisterSuccessResponse"
        );
        expect(route.responses["400"].$ref).toBe("#/components/responses/BadRequest");
        expect(route.responses["409"].$ref).toBe("#/components/responses/Conflict");
        expect(route.responses["500"].$ref).toBe("#/components/responses/InternalError");
    });

    it("should define auth login endpoint correctly", () => {
        const route = getPath("/api/v1/auth/login", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Auth");
        expect(route.security).toEqual([]);
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/LoginInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/LoginSuccessResponse"
        );
    });

    it("should define auth refresh endpoint correctly", () => {
        const route = getPath("/api/v1/auth/refresh", "post");

        expect(route).toBeDefined();
        expect(route.security).toEqual([{ refreshTokenCookie: [] }]);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/RefreshSuccessResponse"
        );
    });

    it("should define auth logout endpoint correctly", () => {
        const route = getPath("/api/v1/auth/logout", "post");

        expect(route).toBeDefined();
        expect(route.security).toEqual([]);
        expect(route.parameters).toEqual([
            {
                in: "cookie",
                name: "refreshToken",
                required: false,
                schema: { type: "string" },
                description: "httpOnly cookie; tùy chọn.",
            },
        ]);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/LogoutSuccessResponse"
        );
    });

    it("should define users me endpoint correctly", () => {
        const route = getPath("/api/v1/users/me", "get");

        expect(route).toBeDefined();
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/UserProfileResponse"
        );
    });

    it("should define users list endpoint correctly", () => {
        const route = getPath("/api/v1/users", "get");

        expect(route).toBeDefined();
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters.map((p) => p.name)).toEqual(["page", "limit", "search", "status"]);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/UsersListResponse"
        );
    });

    it("should define users update/delete endpoint correctly", () => {
        const patchRoute = getPath("/api/v1/users/{id}", "patch");
        const deleteRoute = getPath("/api/v1/users/{id}", "delete");

        expect(patchRoute.parameters[0]).toMatchObject({
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });

        expect(getSchemaRef(patchRoute.requestBody)).toBe("#/components/schemas/UserProfileInput");
        expect(patchRoute.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/UpdateUserResponse"
        );

        expect(deleteRoute.parameters[0]).toMatchObject({
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });

        expect(deleteRoute.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/DeleteUserResponse"
        );
    });

    it("should define update roles endpoint correctly", () => {
        const route = getPath("/api/v1/users/{id}/roles", "patch");

        expect(route).toBeDefined();
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/UpdateUserRolesInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/UpdateRolesResponse"
        );
    });

    it("should define core schemas correctly", () => {
        expect(swaggerSpec.components.schemas.RegisterInput.required).toEqual(["email", "password"]);
        expect(swaggerSpec.components.schemas.LoginInput.required).toEqual(["email", "password"]);
        expect(swaggerSpec.components.schemas.UserPublic.required).toEqual([
            "id",
            "email",
            "full_name",
            "roles",
        ]);
        expect(swaggerSpec.components.schemas.UsersListResponse.required).toEqual([
            "success",
            "data",
            "pagination",
        ]);
    });
});