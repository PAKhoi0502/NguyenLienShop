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

    // ===== Products Tests =====
    it("should define Products tag", () => {
        const productTag = swaggerSpec.tags.find((tag) => tag.name === "Products");
        expect(productTag).toBeDefined();
        expect(productTag.description).toContain("Quản lý sản phẩm");
    });

    it("should define product schemas correctly", () => {
        expect(swaggerSpec.components.schemas.CreateProductInput).toBeDefined();
        expect(swaggerSpec.components.schemas.CreateProductInput.required).toEqual(["name", "category_id"]);

        expect(swaggerSpec.components.schemas.UpdateProductInput).toBeDefined();
        expect(swaggerSpec.components.schemas.Product).toBeDefined();
        expect(swaggerSpec.components.schemas.ProductListItem).toBeDefined();
        expect(swaggerSpec.components.schemas.ProductDetail).toBeDefined();
        expect(swaggerSpec.components.schemas.ProductResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.ProductDetailResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.ProductsListResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.DeleteResponse).toBeDefined();
    });

    it("should define get all products endpoint correctly", () => {
        const route = getPath("/api/v1/products", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Products");
        expect(route.security).toEqual([]);
        expect(route.parameters.map((p) => p.name)).toEqual(["page", "limit", "category_id", "min_price", "max_price", "status", "search", "sortBy"]);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/ProductsListResponse"
        );
    });

    it("should define search products endpoint correctly", () => {
        const route = getPath("/api/v1/products/search", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Products");
        expect(route.security).toEqual([]);
        expect(route.parameters.map((p) => p.name)).toEqual(["q", "limit"]);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/ProductsListResponse"
        );
    });

    it("should define get products by category endpoint correctly", () => {
        const route = getPath("/api/v1/products/category/{categoryId}", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Products");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "categoryId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/ProductsListResponse"
        );
    });

    it("should define get product by slug endpoint correctly", () => {
        const route = getPath("/api/v1/products/slug/{slug}", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Products");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "slug",
            required: true,
            schema: { type: "string" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/ProductDetailResponse"
        );
    });

    it("should define get product by ID endpoint correctly", () => {
        const route = getPath("/api/v1/products/{productId}", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Products");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "productId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/ProductDetailResponse"
        );
    });

    it("should define create product endpoint correctly", () => {
        const route = getPath("/api/v1/products", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Products");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/CreateProductInput");
        expect(route.responses["201"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/ProductResponse"
        );
    });

    it("should define update product endpoint correctly", () => {
        const route = getPath("/api/v1/products/{productId}", "patch");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Products");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "productId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/UpdateProductInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/ProductResponse"
        );
    });

    it("should define delete product endpoint correctly", () => {
        const route = getPath("/api/v1/products/{productId}", "delete");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Products");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "productId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/DeleteResponse"
        );
    });

    // ===== Variants Tests =====
    it("should define Variants tag", () => {
        const variantTag = swaggerSpec.tags.find((tag) => tag.name === "Variants");
        expect(variantTag).toBeDefined();
        expect(variantTag.description).toContain("Quản lý biến thể sản phẩm");
    });

    it("should define variant schemas correctly", () => {
        expect(swaggerSpec.components.schemas.CreateVariantInput).toBeDefined();
        expect(swaggerSpec.components.schemas.CreateVariantInput.required).toEqual(["size", "fabric_type"]);

        expect(swaggerSpec.components.schemas.UpdateVariantInput).toBeDefined();
        expect(swaggerSpec.components.schemas.Variant).toBeDefined();
        expect(swaggerSpec.components.schemas.VariantDetail).toBeDefined();
        expect(swaggerSpec.components.schemas.VariantResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.VariantsListResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.StockResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.ReserveStockInput).toBeDefined();
        expect(swaggerSpec.components.schemas.ReserveStockInput.required).toEqual(["qty_items"]);
    });

    it("should define get variants by product endpoint correctly", () => {
        const route = getPath("/api/v1/products/{productId}/variants", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variants");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "productId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/VariantsListResponse"
        );
    });

    it("should define get variant by ID endpoint correctly", () => {
        const route = getPath("/api/v1/variants/id/{variantId}", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variants");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "variantId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/VariantResponse"
        );
    });

    it("should define check variant stock endpoint correctly", () => {
        const route = getPath("/api/v1/variants/id/{variantId}/stock", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variants");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "variantId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/StockResponse"
        );
    });

    it("should define get max order qty endpoint correctly", () => {
        const route = getPath("/api/v1/variants/id/{variantId}/max-order-qty", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variants");
        expect(route.security).toEqual([]);
        expect(route.parameters).toHaveLength(2);
        expect(route.parameters[0].name).toBe("variantId");
        expect(route.parameters[1].name).toBe("pack_size");
    });

    it("should define create variant endpoint correctly", () => {
        const route = getPath("/api/v1/products/{productId}/variants", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variants");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "productId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/CreateVariantInput");
        expect(route.responses["201"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/VariantResponse"
        );
    });

    it("should define update variant endpoint correctly", () => {
        const route = getPath("/api/v1/variants/id/{variantId}", "patch");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variants");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "variantId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/UpdateVariantInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/VariantResponse"
        );
    });

    it("should define delete variant endpoint correctly", () => {
        const route = getPath("/api/v1/variants/id/{variantId}", "delete");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variants");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "variantId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/DeleteResponse"
        );
    });

    it("should define reserve stock endpoint correctly", () => {
        const route = getPath("/api/v1/variants/id/{variantId}/reserve-stock", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variants");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "variantId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/ReserveStockInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/StockResponse"
        );
    });

    it("should define complete sale endpoint correctly", () => {
        const route = getPath("/api/v1/variants/id/{variantId}/complete-sale", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variants");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "variantId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/ReserveStockInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/StockResponse"
        );
    });

    it("should define release stock endpoint correctly", () => {
        const route = getPath("/api/v1/variants/id/{variantId}/release-stock", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variants");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "variantId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/ReserveStockInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/StockResponse"
        );
    });

    // ===== Variant Units Tests =====
    it("should define Variant Units tag", () => {
        const unitTag = swaggerSpec.tags.find((tag) => tag.name === "Variant Units");
        expect(unitTag).toBeDefined();
        expect(unitTag.description).toContain("Quản lý đơn vị bán của biến thể");
    });

    it("should define variant unit schemas correctly", () => {
        expect(swaggerSpec.components.schemas.CreateVariantUnitInput).toBeDefined();
        expect(swaggerSpec.components.schemas.CreateVariantUnitInput.required).toEqual(["display_name", "pack_size", "price_tiers"]);

        expect(swaggerSpec.components.schemas.UpdateVariantUnitInput).toBeDefined();
        expect(swaggerSpec.components.schemas.VariantUnit).toBeDefined();
        expect(swaggerSpec.components.schemas.CalculatePriceInput).toBeDefined();
        expect(swaggerSpec.components.schemas.CalculatePriceInput.required).toEqual(["qty_packs"]);
        expect(swaggerSpec.components.schemas.PriceCalculationResult).toBeDefined();
        expect(swaggerSpec.components.schemas.VariantUnitResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.VariantUnitsListResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.CalculatePriceResponse).toBeDefined();
    });

    it("should define get variant unit by ID endpoint correctly", () => {
        const route = getPath("/api/v1/variant-units/{unitId}", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variant Units");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "unitId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/VariantUnitResponse"
        );
    });

    it("should define get units by variant endpoint correctly", () => {
        const route = getPath("/api/v1/variants/{variantId}/units", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variant Units");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "variantId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/VariantUnitsListResponse"
        );
    });

    it("should define get default unit endpoint correctly", () => {
        const route = getPath("/api/v1/variants/{variantId}/units/default", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variant Units");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "variantId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/VariantUnitResponse"
        );
    });

    it("should define get price tiers endpoint correctly", () => {
        const route = getPath("/api/v1/variant-units/{unitId}/price-tiers", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variant Units");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "unitId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
    });

    it("should define calculate price endpoint correctly", () => {
        const route = getPath("/api/v1/variant-units/{unitId}/calculate-price", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variant Units");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "unitId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/CalculatePriceInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CalculatePriceResponse"
        );
    });

    it("should define get max orderable qty endpoint correctly", () => {
        const route = getPath("/api/v1/variant-units/{unitId}/max-orderable-qty", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variant Units");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "unitId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
    });

    it("should define create variant unit endpoint correctly", () => {
        const route = getPath("/api/v1/variants/{variantId}/units", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variant Units");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "variantId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/CreateVariantUnitInput");
        expect(route.responses["201"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/VariantUnitResponse"
        );
    });

    it("should define update variant unit endpoint correctly", () => {
        const route = getPath("/api/v1/variant-units/{unitId}", "patch");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variant Units");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "unitId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/UpdateVariantUnitInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/VariantUnitResponse"
        );
    });

    it("should define delete variant unit endpoint correctly", () => {
        const route = getPath("/api/v1/variant-units/{unitId}", "delete");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variant Units");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "unitId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/DeleteResponse"
        );
    });

    it("should define validate tiers endpoint correctly", () => {
        const route = getPath("/api/v1/variant-units/validate-tiers", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Variant Units");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
    });

    // ===== CARTS TESTS =====

    it("should define Carts tag", () => {
        const cartTag = swaggerSpec.tags.find((tag) => tag.name === "Carts");
        expect(cartTag).toBeDefined();
        expect(cartTag.description).toContain("Quản lý giỏ hàng");
    });

    it("should define cart schemas correctly", () => {
        // ✅ Core cart schemas
        expect(swaggerSpec.components.schemas.CartItem).toBeDefined();
        expect(swaggerSpec.components.schemas.CartItem.required).toEqual([
            "id",
            "product_id",
            "variant_id",
            "unit_id",
            "sku",
            "quantity",
            "price_at_added",
            "line_total",
        ]);

        expect(swaggerSpec.components.schemas.CartDiscount).toBeDefined();
        expect(swaggerSpec.components.schemas.CartDiscount.required).toEqual([
            "code",
            "type",
            "value",
            "discount_amount",
            "applied_at",
        ]);

        expect(swaggerSpec.components.schemas.CartTotals).toBeDefined();
        expect(swaggerSpec.components.schemas.CartTotals.required).toEqual([
            "subtotal",
            "discount_amount",
            "total",
            "item_count",
            "items_total_units",
        ]);

        expect(swaggerSpec.components.schemas.Cart).toBeDefined();
        expect(swaggerSpec.components.schemas.Cart.required).toEqual([
            "id",
            "items",
            "totals",
            "status",
            "created_at",
            "updated_at",
        ]);

        expect(swaggerSpec.components.schemas.CartSummary).toBeDefined();
        expect(swaggerSpec.components.schemas.CartSummary.required).toEqual([
            "id",
            "item_count",
            "total",
        ]);

        // ✅ Input schemas
        expect(swaggerSpec.components.schemas.AddToCartInput).toBeDefined();
        expect(swaggerSpec.components.schemas.AddToCartInput.required).toEqual([
            "product_id",
            "variant_id",
            "unit_id",
            "sku",
            "variant_label",
            "product_name",
            "display_name",
            "pack_size",
            "price_at_added",
            "quantity",
        ]);

        expect(swaggerSpec.components.schemas.UpdateCartItemInput).toBeDefined();
        expect(swaggerSpec.components.schemas.UpdateCartItemInput.required).toEqual(["quantity"]);

        expect(swaggerSpec.components.schemas.ApplyDiscountInput).toBeDefined();
        expect(swaggerSpec.components.schemas.ApplyDiscountInput.required).toEqual(["code"]);

        expect(swaggerSpec.components.schemas.MergeCartInput).toBeDefined();
        expect(swaggerSpec.components.schemas.MergeCartInput.required).toEqual(["session_key"]);

        expect(swaggerSpec.components.schemas.CreateGuestCartInput).toBeDefined();
        expect(swaggerSpec.components.schemas.CreateGuestCartInput.required).toEqual(["session_key"]);

        // ✅ Output schemas
        expect(swaggerSpec.components.schemas.CheckoutSnapshot).toBeDefined();
        expect(swaggerSpec.components.schemas.CheckoutSnapshot.required).toEqual([
            "source_cart_id",
            "items",
            "totals",
            "snapshot_at",
        ]);

        expect(swaggerSpec.components.schemas.CartValidation).toBeDefined();
        expect(swaggerSpec.components.schemas.CartValidation.required).toEqual([
            "isValid",
            "errors",
            "totals",
        ]);

        expect(swaggerSpec.components.schemas.AbandonedCart).toBeDefined();
        expect(swaggerSpec.components.schemas.AbandonedCart.required).toEqual([
            "id",
            "items",
            "totals",
            "status",
        ]);

        // ✅ Response schemas
        expect(swaggerSpec.components.schemas.CartResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.CartResponse.required).toEqual(["success", "data"]);

        expect(swaggerSpec.components.schemas.CartListResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.CartListResponse.required).toEqual([
            "success",
            "data",
            "pagination",
        ]);

        expect(swaggerSpec.components.schemas.CheckoutResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.CheckoutResponse.required).toEqual([
            "success",
            "data",
            "message",
        ]);

        expect(swaggerSpec.components.schemas.ValidateResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.ValidateResponse.required).toEqual(["success", "data"]);

        expect(swaggerSpec.components.schemas.AbandonedResponse).toBeDefined();
        expect(swaggerSpec.components.schemas.AbandonedResponse.required).toEqual([
            "success",
            "data",
            "message",
        ]);
    });

    it("should define create guest cart endpoint correctly", () => {
        const route = getPath("/api/v1/carts/guest", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([]);
        expect(route.description).toContain("khách");
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/CreateGuestCartInput");
        expect(route.responses["201"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CartResponse"
        );
        expect(route.responses["400"].$ref).toBe("#/components/responses/BadRequest");
        expect(route.responses["500"].$ref).toBe("#/components/responses/InternalError");
    });

    it("should define get guest cart endpoint correctly", () => {
        const route = getPath("/api/v1/carts/guest/{sessionKey}", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "sessionKey",
            required: true,
            schema: { type: "string", format: "uuid" },
        });
        expect(route.parameters[1]).toMatchObject({
            in: "query",
            name: "format",
            schema: { type: "string", enum: ["summary", "detail", "checkout"], default: "summary" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CartResponse"
        );
        expect(route.responses["404"].$ref).toBe("#/components/responses/NotFound");
    });

    it("should define get user cart endpoint correctly", () => {
        const route = getPath("/api/v1/carts", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "query",
            name: "format",
            schema: { type: "string", enum: ["summary", "detail", "checkout"], default: "summary" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CartResponse"
        );
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
        expect(route.responses["404"].$ref).toBe("#/components/responses/NotFound");
    });

    it("should define clear cart endpoint correctly", () => {
        const route = getPath("/api/v1/carts", "delete");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "query",
            name: "keep_discount",
            schema: { type: "boolean", default: false },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CartResponse"
        );
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
    });

    it("should define add item endpoint correctly", () => {
        const route = getPath("/api/v1/carts/items", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.description).toContain("Thêm sản phẩm vào giỏ hàng");
        expect(route.parameters[0]).toMatchObject({
            in: "query",
            name: "session_key",
            schema: { type: "string", format: "uuid" },
            description: "Session key cho giỏ khách (nếu không có JWT)",
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/AddToCartInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CartResponse"
        );
        expect(route.responses["400"].$ref).toBe("#/components/responses/BadRequest");
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
        expect(route.responses["404"].$ref).toBe("#/components/responses/NotFound");
    });

    it("should define update item endpoint correctly", () => {
        const route = getPath("/api/v1/carts/items/{itemId}", "patch");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "itemId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/UpdateCartItemInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CartResponse"
        );
        expect(route.responses["400"].$ref).toBe("#/components/responses/BadRequest");
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
        expect(route.responses["404"].$ref).toBe("#/components/responses/NotFound");
    });

    it("should define remove item endpoint correctly", () => {
        const route = getPath("/api/v1/carts/items/{itemId}", "delete");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "path",
            name: "itemId",
            required: true,
            schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CartResponse"
        );
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
        expect(route.responses["404"].$ref).toBe("#/components/responses/NotFound");
    });

    it("should define apply discount endpoint correctly", () => {
        const route = getPath("/api/v1/carts/discount", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/ApplyDiscountInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CartResponse"
        );
        expect(route.responses["400"].$ref).toBe("#/components/responses/BadRequest");
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
        expect(route.responses["404"].$ref).toBe("#/components/responses/NotFound");
    });

    it("should define remove discount endpoint correctly", () => {
        const route = getPath("/api/v1/carts/discount", "delete");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CartResponse"
        );
        expect(route.responses["400"].$ref).toBe("#/components/responses/BadRequest");
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
    });

    it("should define merge cart endpoint correctly", () => {
        const route = getPath("/api/v1/carts/merge", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.description).toContain("merge");
        expect(getSchemaRef(route.requestBody)).toBe("#/components/schemas/MergeCartInput");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CartResponse"
        );
        expect(route.responses["400"].$ref).toBe("#/components/responses/BadRequest");
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
    });

    it("should define abandon cart endpoint correctly", () => {
        const route = getPath("/api/v1/carts/abandon", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/AbandonedResponse"
        );
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
        expect(route.responses["404"].$ref).toBe("#/components/responses/NotFound");
    });

    it("should define checkout cart endpoint correctly", () => {
        const route = getPath("/api/v1/carts/checkout", "post");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.description).toContain("Kiểm tra giỏ hàng");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CheckoutResponse"
        );
        expect(route.responses["400"].$ref).toBe("#/components/responses/BadRequest");
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
        expect(route.responses["404"].$ref).toBe("#/components/responses/NotFound");
    });

    it("should define validate cart endpoint correctly", () => {
        const route = getPath("/api/v1/carts/validate", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.description).toContain("dry-run");
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/ValidateResponse"
        );
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
        expect(route.responses["404"].$ref).toBe("#/components/responses/NotFound");
    });

    it("should define get abandoned carts endpoint correctly", () => {
        const route = getPath("/api/v1/admin/carts/abandoned", "get");

        expect(route).toBeDefined();
        expect(route.tags).toContain("Carts");
        expect(route.security).toEqual([{ bearerAuth: [] }]);
        expect(route.parameters[0]).toMatchObject({
            in: "query",
            name: "days_ago",
            schema: { type: "integer", minimum: 1, default: 7 },
        });
        expect(route.parameters[1]).toMatchObject({
            in: "query",
            name: "limit",
            schema: { type: "integer", minimum: 1, maximum: 500, default: 100 },
        });
        expect(route.responses["200"].content["application/json"].schema.$ref).toBe(
            "#/components/schemas/CartListResponse"
        );
        expect(route.responses["401"].$ref).toBe("#/components/responses/Unauthorized");
        expect(route.responses["403"].$ref).toBe("#/components/responses/Forbidden");
    });

    // ===== CART ITEMS VALIDATION =====

    it("should validate CartItem schema properties", () => {
        const itemSchema = swaggerSpec.components.schemas.CartItem;

        expect(itemSchema.properties.product_id.pattern).toBe("^[a-fA-F0-9]{24}$");
        expect(itemSchema.properties.variant_id.pattern).toBe("^[a-fA-F0-9]{24}$");
        expect(itemSchema.properties.unit_id.pattern).toBe("^[a-fA-F0-9]{24}$");
        expect(itemSchema.properties.sku.type).toBe("string");
        expect(itemSchema.properties.quantity.type).toBe("integer");
        expect(itemSchema.properties.quantity.example).toBe(5);
        expect(itemSchema.properties.price_at_added.type).toBe("number");
        expect(itemSchema.properties.price_at_added.example).toBe(180000);
        expect(itemSchema.properties.line_total.type).toBe("number");
        expect(itemSchema.properties.line_total.example).toBe(900000);
    });

    it("should validate AddToCartInput schema constraints", () => {
        const inputSchema = swaggerSpec.components.schemas.AddToCartInput;

        expect(inputSchema.properties.sku.minLength).toBe(3);
        expect(inputSchema.properties.sku.maxLength).toBe(50);
        expect(inputSchema.properties.sku.pattern).toBe("^[A-Z0-9\\-]+$");

        expect(inputSchema.properties.quantity.minimum).toBe(1);
        expect(inputSchema.properties.quantity.maximum).toBe(999);

        expect(inputSchema.properties.pack_size.minimum).toBe(1);
        expect(inputSchema.properties.pack_size.maximum).toBe(10000);

        expect(inputSchema.properties.price_at_added.minimum).toBe(0);
        expect(inputSchema.properties.price_at_added.maximum).toBe(999999999);
    });

    it("should validate CartDiscount schema properties", () => {
        const discountSchema = swaggerSpec.components.schemas.CartDiscount;

        expect(discountSchema.properties.type.enum).toEqual(["PERCENT", "FIXED"]);
        expect(discountSchema.properties.apply_scope.enum).toEqual(["CART", "PRODUCT"]);
        expect(discountSchema.properties.code.type).toBe("string");
    });

    it("should validate CartTotals schema calculations", () => {
        const totalsSchema = swaggerSpec.components.schemas.CartTotals;

        expect(totalsSchema.properties.subtotal.example).toBe(900000);
        expect(totalsSchema.properties.discount_amount.example).toBe(90000);
        expect(totalsSchema.properties.total.example).toBe(810000);
        expect(totalsSchema.properties.item_count.example).toBe(1);
        expect(totalsSchema.properties.items_total_units.example).toBe(500);
    });

    it("should validate CheckoutSnapshot structure", () => {
        const snapshotSchema = swaggerSpec.components.schemas.CheckoutSnapshot;

        expect(snapshotSchema.properties.source_cart_id).toBeDefined();
        expect(snapshotSchema.properties.cart_id).toBeDefined();
        expect(snapshotSchema.properties.items.type).toBe("array");
        expect(snapshotSchema.properties.discount).toBeDefined();
        expect(snapshotSchema.properties.totals).toBeDefined();
        expect(snapshotSchema.properties.snapshot_at.type).toBe("string");
        expect(snapshotSchema.properties.snapshot_at.format).toBe("date-time");
    });

    it("should validate CartValidation response structure", () => {
        const validationSchema = swaggerSpec.components.schemas.CartValidation;

        expect(validationSchema.properties.isValid.type).toBe("boolean");
        expect(validationSchema.properties.errors.type).toBe("array");
        expect(validationSchema.properties.errors.items.type).toBe("string");
        expect(validationSchema.properties.totals).toBeDefined();
    });

    it("should validate MergeCartInput has UUID session_key", () => {
        const mergeSchema = swaggerSpec.components.schemas.MergeCartInput;

        expect(mergeSchema.properties.session_key.type).toBe("string");
        expect(mergeSchema.properties.session_key.format).toBe("uuid");
        expect(mergeSchema.required).toContain("session_key");
    });

    it("should validate CreateGuestCartInput has UUID session_key", () => {
        const createGuestSchema = swaggerSpec.components.schemas.CreateGuestCartInput;

        expect(createGuestSchema.properties.session_key.type).toBe("string");
        expect(createGuestSchema.properties.session_key.format).toBe("uuid");
        expect(createGuestSchema.required).toContain("session_key");
    });

    it("should validate ApplyDiscountInput code format", () => {
        const applySchema = swaggerSpec.components.schemas.ApplyDiscountInput;

        expect(applySchema.properties.code.type).toBe("string");
        expect(applySchema.properties.code.minLength).toBe(3);
        expect(applySchema.properties.code.maxLength).toBe(20);
        expect(applySchema.properties.code.pattern).toBe("^[A-Z0-9\\-]+$");
    });

    it("should validate response schemas use proper refs", () => {
        const cartResponse = swaggerSpec.components.schemas.CartResponse;
        expect(cartResponse.properties.data.allOf).toBeDefined();
        expect(cartResponse.properties.data.allOf[0].$ref).toBe(
            "#/components/schemas/Cart"
        );

        const checkoutResponse = swaggerSpec.components.schemas.CheckoutResponse;
        expect(checkoutResponse.properties.data.allOf).toBeDefined();
        expect(checkoutResponse.properties.message.type).toBe("string");
    });

    it("should validate all cart endpoints have proper error responses", () => {
        const cartEndpoints = [
            ["/api/v1/carts/guest", "post"],
            ["/api/v1/carts/guest/{sessionKey}", "get"],
            ["/api/v1/carts", "get"],
            ["/api/v1/carts", "delete"],
            ["/api/v1/carts/items", "post"],
            ["/api/v1/carts/items/{itemId}", "patch"],
            ["/api/v1/carts/items/{itemId}", "delete"],
            ["/api/v1/carts/discount", "post"],
            ["/api/v1/carts/discount", "delete"],
            ["/api/v1/carts/merge", "post"],
            ["/api/v1/carts/abandon", "post"],
            ["/api/v1/carts/checkout", "post"],
            ["/api/v1/carts/validate", "get"],
            ["/api/v1/admin/carts/abandoned", "get"],
        ];

        cartEndpoints.forEach(([path, method]) => {
            const route = getPath(path, method);
            expect(route).toBeDefined();
            expect(route.responses["500"]).toBeDefined();
        });
    });

    it("should validate guest cart endpoints don't require auth", () => {
        const guestCreateRoute = getPath("/api/v1/carts/guest", "post");
        const guestGetRoute = getPath("/api/v1/carts/guest/{sessionKey}", "get");

        expect(guestCreateRoute.security).toEqual([]);
        expect(guestGetRoute.security).toEqual([]);
    });

    it("should validate user cart endpoints require auth", () => {
        const userRoute = getPath("/api/v1/carts", "get");
        const addItemRoute = getPath("/api/v1/carts/items", "post");
        const updateItemRoute = getPath("/api/v1/carts/items/{itemId}", "patch");

        expect(userRoute.security).toEqual([{ bearerAuth: [] }]);
        expect(addItemRoute.security).toBeDefined();
        expect(updateItemRoute.security).toEqual([{ bearerAuth: [] }]);
    });

    it("should validate admin cart endpoints require admin role", () => {
        const adminRoute = getPath("/api/v1/admin/carts/abandoned", "get");

        expect(adminRoute.security).toEqual([{ bearerAuth: [] }]);
        expect(adminRoute.parameters).toBeDefined();
    });

    it("should validate cart pagination response", () => {
        const listResponse = swaggerSpec.components.schemas.CartListResponse;

        expect(listResponse.properties.pagination).toBeDefined();
        expect(listResponse.properties.pagination.properties.total.type).toBe("integer");
        expect(listResponse.properties.pagination.properties.limit.type).toBe("integer");
        expect(listResponse.properties.pagination.required).toEqual(["total", "limit"]);
    });

});
