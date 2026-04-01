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

    // ===== User Addresses Tests =====
    it("should define User Addresses tag", () => {
        const addressTag = swaggerSpec.tags.find((tag) => tag.name === "User Addresses");
        expect(addressTag).toBeDefined();
        expect(addressTag.description).toContain("Quản lý địa chỉ giao hàng");
    });

    it("should define user address schemas correctly", () => {
        expect(swaggerSpec.components.schemas.CreateUserAddressInput).toBeDefined();
        expect(swaggerSpec.components.schemas.CreateUserAddressInput.required).toEqual([
            "receiver_name",
            "phone",
            "address_line_1",
            "city",
            "district",
            "ward",
        ]);

        expect(swaggerSpec.components.schemas.UpdateUserAddressInput).toBeDefined();
        expect(swaggerSpec.components.schemas.UserAddress).toBeDefined();
        expect(swaggerSpec.components.schemas.UserAddressListResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.CreateUserAddressResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.UpdateUserAddressResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.DeleteUserAddressResponse).toBeDefined();
    });

    it("should define create address endpoint correctly", () => {
        const route = getPath("/api/v1/user-addresses", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("User Addresses");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/CreateUserAddressInput");
        expect(route.responses["201"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CreateUserAddressResponse"
        );
    });

    it("should define get addresses endpoint correctly", () => {
        const route = getPath("/api/v1/user-addresses/{userId}", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("User Addresses");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/UserAddressListResponse"
        );
    });

    it("should define update address endpoint correctly", () => {
        const route = getPath("/api/v1/user-addresses/{userId}/{addressId}", "patch");

        expect(route).toBeDefined();
        expect(route.tags).toContain("User Addresses");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters).toHaveLength(2);
        expect(route.parameters[0].name).toBe("userId");
        expect(route.parameters[1].name).toBe("addressId");
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/UpdateUserAddressInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/UpdateUserAddressResponse"
        );
    });

    it("should define delete address endpoint correctly", () => {
        const route = getPath("/api/v1/user-addresses/{userId}/{addressId}", "delete");

        expect(route).toBeDefined();
        expect(route.tags).toContain("User Addresses");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/DeleteUserAddressResponse"
        );
    });

    it("should define set default address endpoint correctly", () => {
        const route = getPath("/api/v1/user-addresses/{userId}/{addressId}/set-default", "patch");

        expect(route).toBeDefined();
        expect(route.tags).toContain("User Addresses");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters).toHaveLength(2);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/UpdateUserAddressResponse"
        );
    });

    // ===== Categories Tests =====
    it("should define Categories tag", () => {
        const categoryTag = swaggerSpec.tags.find((tag) => tag.name === "Categories");
        expect(categoryTag).toBeDefined();
        expect(categoryTag.description).toContain("Quản lý danh mục");
    });

    it("should define category schemas correctly", () => {
        expect(swaggerSpec.components.schemas.CreateCategoryInput).toBeDefined();
        expect(swaggerSpec.components.schemas.CreateCategoryInput.required).toEqual(["name", "slug"]);

        expect(swaggerSpec.components.schemas.UpdateCategoryInput).toBeDefined();
        expect(swaggerSpec.components.schemas.Category).toBeDefined();
        expect(swaggerSpec.components.schemas.CategoryTree).toBeDefined();
        expect(swaggerSpec.components.schemas.BreadcrumbItem).toBeDefined();
        expect(swaggerSpec.components.schemas.CategoryResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.CategoryTreeResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.CategoriesListResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.BreadcrumbResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.DeleteCategoryResponse).toBeDefined();
    });

    it("should define get category tree endpoint correctly", () => {
        const route = getPath("/api/v1/categories/tree", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Categories");
        expect(route.security).toEqual([]);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CategoryTreeResponse"
        );
    });

    it("should define get all categories endpoint correctly", () => {
        const route = getPath("/api/v1/categories/all", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Categories");
        expect(route.security).toEqual([]);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CategoriesListResponse"
        );
    });

    it("should define get category by slug endpoint correctly", () => {
        const route = getPath("/api/v1/categories/slug/{slug}", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Categories");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "slug",
            required: true,
            schema: { type: "string" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CategoryResponse"
        );
    });

    it("should define get category by ID endpoint correctly", () => {
        const route = getPath("/api/v1/categories/{categoryId}", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Categories");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "categoryId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CategoryResponse"
        );
    });

    it("should define create category endpoint correctly", () => {
        const route = getPath("/api/v1/categories/{categoryId}", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Categories");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/CreateCategoryInput");
        expect(route.responses["201"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CategoryResponse"
        );
    });

    it("should define update category endpoint correctly", () => {
        const route = getPath("/api/v1/categories/{categoryId}", "patch");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Categories");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "categoryId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/UpdateCategoryInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CategoryResponse"
        );
    });

    it("should define delete category endpoint correctly", () => {
        const route = getPath("/api/v1/categories/{categoryId}", "delete");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Categories");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "categoryId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/DeleteCategoryResponse"
        );
    });

    it("should define get category breadcrumb endpoint correctly", () => {
        const route = getPath("/api/v1/categories/{categoryId}/breadcrumb", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Categories");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "categoryId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/BreadcrumbResponse"
        );
    });
});
