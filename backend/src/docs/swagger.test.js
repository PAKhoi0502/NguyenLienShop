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
});
