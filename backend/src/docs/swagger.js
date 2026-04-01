/**
 * OpenAPI 3 — định nghĩa tĩnh (static spec). app.js: swaggerUi.setup(swaggerSpec).
 */
const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "NguyenLien API",
        version: "1.0.0",
        description:
            "Manager API Documentation. Chuẩn Bearer dùng cho route gắn authMiddleware (ghi `security: [{ bearerAuth: [] }]` trên từng operation). Auth cookie: refresh token.",
    },
    servers: [{ url: "http://localhost:5000" }],
    tags: [
        {
            name: "Auth",
            description:
                "Đăng ký, đăng nhập, refresh access token, đăng xuất.",
        },
        {
            name: "Users",
            description:
                "Quản lý thông tin người dùng: lấy profile hiện tại, danh sách user, cập nhật profile, xoá mềm, cập nhật roles.",
        },
        {
            name: "User Addresses",
            description:
                "Quản lý địa chỉ giao hàng: tạo, lấy danh sách, cập nhật, đặt mặc định, xoá.",
        },
        {
            name: "Categories",
            description:
                "Quản lý danh mục sản phẩm: lấy cây phân cấp, danh sách phẳng, tạo, cập nhật, xoá mềm, restore.",
        },
        {
            name: "Products",
            description: "Quản lý sản phẩm: lấy danh sách, tìm kiếm, tạo, cập nhật, xoá mềm.",
        },
        {
            name: "Variants",
            description: "Quản lý biến thể sản phẩm: lấy danh sách, tạo, cập nhật, xoá mềm, quản lý tồn kho.",
        },
        {
            name: "Variant Units",
            description: "Quản lý đơn vị bán của biến thể: lấy danh sách, tạo, cập nhật, xoá, tính giá.",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description:
                    "JWT access token. Header: `Authorization: Bearer <accessToken>`. Chỉ dùng cho các endpoint backend thực sự kiểm tra Bearer (vd. sau khi bạn gắn authMiddleware).",
            },
            refreshTokenCookie: {
                type: "apiKey",
                in: "cookie",
                name: "refreshToken",
                description:
                    "Refresh token cookie (httpOnly). Đăng nhập thành công sẽ được server Set-Cookie; Swagger UI → Authorize → nhập giá trị cookie nếu test tay.",
            },
        },
        responses: {
            BadRequest: {
                description: "Bad Request / Validation",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                    },
                },
            },
            NotFound: {
                description: "Not Found",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                    },
                },
            },
            Unauthorized: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                    },
                },
            },
            Forbidden: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                    },
                },
            },
            Conflict: {
                description: "Conflict",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                    },
                },
            },
            InternalError: {
                description: "Internal Server Error",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                    },
                },
            },
        },
        schemas: {
            RegisterInput: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    password: {
                        type: "string",
                        minLength: 6,
                        description: "Khớp Zod register (tối thiểu 6 ký tự).",
                    },
                    full_name: {
                        type: "string",
                        minLength: 2,
                        description: "Khớp Zod register (tối thiểu 2 ký tự).",
                    },
                },
                required: ["email", "password"],
                example: {
                    email: "test@example.com",
                    password: "test"
                },
            },
            LoginInput: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    password: {
                        type: "string",
                        minLength: 1,
                        description: "Khớp Zod login (bắt buộc, ≥1 ký tự).",
                    },
                },
                required: ["email", "password"],
                example: {
                    email: "test@example.com",
                    password: "test",
                },
            },
            UserPublic: {
                type: "object",
                description: "Thông tin user trả về cho client (không có password).",
                properties: {
                    id: {
                        type: "string",
                        pattern: "^[a-fA-F0-9]{24}$",
                        description: "MongoDB ObjectId dạng chuỗi hex 24 ký tự",
                        example: "507f1f77bcf86cd799439011",
                    },
                    email: { type: "string", format: "email", example: "user@example.com" },
                    full_name: { type: "string", example: "Nguyen Van A" },
                    roles: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: ["CUSTOMER", "MANAGER", "ADMIN"],
                        },
                        example: ["CUSTOMER"],
                    },
                },
                required: ["id", "email", "full_name", "roles"],
            },
            UserProfileInput: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        minLength: 2,
                        description: "Tên hiển thị / full name.",
                    },
                    avatar: {
                        type: "string",
                        format: "uri",
                        description: "URL avatar.",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        description: "Email mới (nếu cho phép cập nhật).",
                    },
                    phone: {
                        type: "string",
                        description: "Số điện thoại.",
                    },
                },
                example: {
                    name: "Nguyen Van B",
                    avatar: "https://example.com/avatar.png",
                    email: "new@example.com",
                    phone: "0912345678",
                },
            },
            UpdateUserRolesInput: {
                type: "object",
                properties: {
                    roles: {
                        type: "array",
                        minItems: 1,
                        items: {
                            type: "string",
                            enum: ["CUSTOMER", "MANAGER", "ADMIN"],
                        },
                    },
                },
                required: ["roles"],
                example: {
                    roles: ["MANAGER"],
                },
            },
            UserListItem: {
                allOf: [
                    { $ref: "#/components/schemas/UserPublic" },
                    {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
                            },
                            is_email_verified: { type: "boolean" },
                            email_verified_at: { type: ["string", "null"], format: "date-time" },
                            last_login_at: { type: ["string", "null"], format: "date-time" },
                            created_at: { type: ["string", "null"], format: "date-time" },
                            updated_at: { type: ["string", "null"], format: "date-time" },
                            profile: {
                                type: "object",
                                properties: {
                                    avatar_url: { type: ["string", "null"], example: "https://example.com/avatar.png" },
                                    phone_number: { type: ["string", "null"], example: "0912345678" },
                                },
                            },
                        },
                    },
                ],
            },
            UserProfileResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/UserListItem" },
                },
                required: ["success", "data"],
            },
            UsersListResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/UserListItem" },
                    },
                    pagination: {
                        type: "object",
                        properties: {
                            current_page: { type: "integer", example: 1 },
                            total_pages: { type: "integer", example: 1 },
                            total_items: { type: "integer", example: 1 },
                            per_page: { type: "integer", example: 20 },
                        },
                        required: ["current_page", "total_pages", "total_items", "per_page"],
                    },
                },
                required: ["success", "data", "pagination"],
            },
            UpdateUserResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User updated successfully" },
                    data: { $ref: "#/components/schemas/UserListItem" },
                },
                required: ["success", "message", "data"],
            },
            DeleteUserResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User deleted successfully" },
                },
                required: ["success", "message"],
            },
            UpdateRolesResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User roles updated successfully" },
                    data: { $ref: "#/components/schemas/UserListItem" },
                },
                required: ["success", "message", "data"],
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    code: { type: "string", example: "INVALID_CREDENTIALS" },
                    message: { type: "string", example: "Email hoặc mật khẩu không đúng" },
                },
                required: ["success", "code", "message"],
                example: {
                    success: false,
                    code: "VALIDATION_ERROR",
                    message: "Invalid email",
                },
            },
            RegisterSuccessResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Đăng ký thành công" },
                    data: {
                        type: "object",
                        properties: {
                            user: { $ref: "#/components/schemas/UserPublic" },
                        },
                        required: ["user"],
                    },
                },
                required: ["success", "message", "data"],
                example: {
                    success: true,
                    message: "Đăng ký thành công",
                    data: {
                        user: {
                            id: "507f1f77bcf86cd799439011",
                            email: "new.user@example.com",
                            full_name: "Nguyen Van A",
                            roles: ["CUSTOMER"],
                        },
                    },
                },
            },
            LoginSuccessResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Đăng nhập thành công" },
                    data: {
                        type: "object",
                        properties: {
                            accessToken: { type: "string", description: "JWT access token" },
                            user: { $ref: "#/components/schemas/UserPublic" },
                        },
                        required: ["accessToken", "user"],
                    },
                },
                required: ["success", "message", "data"],
                example: {
                    success: true,
                    message: "Đăng nhập thành công",
                    data: {
                        accessToken:
                            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEifQ.signature",
                        user: {
                            id: "507f1f77bcf86cd799439011",
                            email: "user@example.com",
                            full_name: "Nguyen Van A",
                            roles: ["CUSTOMER"],
                        },
                    },
                },
            },
            RefreshSuccessResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Refresh token thành công" },
                    data: {
                        type: "object",
                        properties: {
                            accessToken: { type: "string" },
                        },
                        required: ["accessToken"],
                    },
                },
                required: ["success", "message", "data"],
                example: {
                    success: true,
                    message: "Refresh token thành công",
                    data: {
                        accessToken:
                            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEifQ.newAccess",
                    },
                },
            },
            LogoutSuccessResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Đăng xuất thành công" },
                    data: {
                        type: "object",
                        nullable: true,
                        description: "Luôn null — cùng envelope với các response có `data`.",
                        example: null,
                    },
                },
                required: ["success", "message", "data"],
                example: {
                    success: true,
                    message: "Đăng xuất thành công",
                    data: null,
                },
            },
            PaginatedMeta: {
                type: "object",
                properties: {
                    page: { type: "integer", minimum: 1, example: 1 },
                    limit: { type: "integer", minimum: 1, example: 20 },
                    total: { type: "integer", minimum: 0, example: 150 },
                },
                required: ["page", "limit", "total"],
            },
            PaginatedResponse: {
                type: "object",
                description:
                    "Chuẩn dự kiến cho list (chưa gắn path). `data` = mảng item; khi implement, dùng allOf hoặc schema riêng cho từng resource.",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "OK" },
                    data: {
                        type: "array",
                        items: { type: "object", description: "Thay bằng $ref tới schema phần tử" },
                        example: [],
                    },
                    meta: { $ref: "#/components/schemas/PaginatedMeta" },
                },
                required: ["success", "message", "data", "meta"],
                example: {
                    success: true,
                    message: "OK",
                    data: [],
                    meta: { page: 1, limit: 20, total: 150 },
                },
            },
            CreateUserAddressInput: {
                type: "object",
                properties: {
                    receiver_name: {
                        type: "string",
                        minLength: 1,
                        description: "Tên người nhận",
                        example: "Nguyen Van A",
                    },
                    phone: {
                        type: "string",
                        pattern: "^(0|\\+84)[0-9]{9}$",
                        description: "Số điện thoại Việt Nam",
                        example: "0912345678",
                    },
                    address_line_1: {
                        type: "string",
                        minLength: 1,
                        description: "Địa chỉ dòng 1",
                        example: "123 Đường Lê Lợi",
                    },
                    address_line_2: {
                        type: "string",
                        description: "Địa chỉ dòng 2 (tùy chọn)",
                        example: "Căn hộ 101",
                    },
                    city: {
                        type: "string",
                        minLength: 1,
                        description: "Thành phố/Tỉnh",
                        example: "Ho Chi Minh",
                    },
                    district: {
                        type: "string",
                        minLength: 1,
                        description: "Quận/Huyện",
                        example: "District 1",
                    },
                    ward: {
                        type: "string",
                        minLength: 1,
                        description: "Phường/Xã",
                        example: "Ward 1",
                    },
                    is_default: {
                        type: "boolean",
                        description: "Địa chỉ mặc định",
                        default: false,
                    },
                },
                required: ["receiver_name", "phone", "address_line_1", "city", "district", "ward"],
                example: {
                    receiver_name: "Nguyen Van A",
                    phone: "0912345678",
                    address_line_1: "123 Đường Lê Lợi",
                    address_line_2: "Căn hộ 101",
                    city: "Ho Chi Minh",
                    district: "District 1",
                    ward: "Ward 1",
                    is_default: false,
                },
            },
            UpdateUserAddressInput: {
                type: "object",
                properties: {
                    receiver_name: { type: "string", minLength: 1 },
                    phone: { type: "string", pattern: "^(0|\\+84)[0-9]{9}$" },
                    address_line_1: { type: "string", minLength: 1 },
                    address_line_2: { type: "string" },
                    city: { type: "string", minLength: 1 },
                    district: { type: "string", minLength: 1 },
                    ward: { type: "string", minLength: 1 },
                    is_default: { type: "boolean" },
                },
                example: {
                    receiver_name: "Nguyen Van B",
                    phone: "0987654321",
                },
            },
            UserAddress: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        pattern: "^[a-fA-F0-9]{24}$",
                        description: "MongoDB ObjectId",
                        example: "507f1f77bcf86cd799439011",
                    },
                    user_id: {
                        type: "string",
                        pattern: "^[a-fA-F0-9]{24}$",
                        description: "User ID",
                        example: "507f1f77bcf86cd799439012",
                    },
                    receiver_name: { type: "string", example: "Nguyen Van A" },
                    phone: { type: "string", example: "0912345678" },
                    address_line_1: { type: "string", example: "123 Đường Lê Lợi" },
                    address_line_2: { type: "string", example: "Căn hộ 101" },
                    city: { type: "string", example: "Ho Chi Minh" },
                    district: { type: "string", example: "District 1" },
                    ward: { type: "string", example: "Ward 1" },
                    is_default: { type: "boolean", example: false },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                },
                required: [
                    "id",
                    "user_id",
                    "receiver_name",
                    "phone",
                    "address_line_1",
                    "city",
                    "district",
                    "ward",
                    "is_default",
                    "created_at",
                    "updated_at",
                ],
            },
            UserAddressListResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/UserAddress" },
                    },
                },
                required: ["success", "data"],
            },
            CreateUserAddressResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/UserAddress" },
                },
                required: ["success", "data"],
            },
            UpdateUserAddressResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/UserAddress" },
                },
                required: ["success", "data"],
            },
            DeleteUserAddressResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/UserAddress" },
                },
                required: ["success", "data"],
            },
            CreateCategoryInput: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        minLength: 2,
                        maxLength: 100,
                        description: "Category name",
                        example: "Electronics",
                    },
                    slug: {
                        type: "string",
                        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                        description: "URL-friendly slug",
                        example: "electronics",
                    },
                    description: {
                        type: "string",
                        maxLength: 500,
                        description: "Category description",
                        example: "Electronic devices and accessories",
                    },
                    parent_id: {
                        type: ["string", "null"],
                        pattern: "^[a-fA-F0-9]{24}$",
                        description: "Parent category ID (optional)",
                        example: null,
                    },
                    status: {
                        type: "string",
                        enum: ["ACTIVE", "INACTIVE"],
                        default: "ACTIVE",
                        description: "Category status",
                    },
                    icon_url: {
                        type: ["string", "null"],
                        format: "uri",
                        description: "Category icon URL",
                    },
                    image_url: {
                        type: ["string", "null"],
                        format: "uri",
                        description: "Category image URL",
                    },
                    display_order: {
                        type: "integer",
                        minimum: 0,
                        default: 0,
                        description: "Display order",
                    },
                },
                required: ["name", "slug"],
            },
            UpdateCategoryInput: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        minLength: 2,
                        maxLength: 100,
                    },
                    slug: {
                        type: "string",
                        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                    },
                    description: {
                        type: "string",
                        maxLength: 500,
                    },
                    status: {
                        type: "string",
                        enum: ["ACTIVE", "INACTIVE"],
                    },
                    icon_url: {
                        type: ["string", "null"],
                        format: "uri",
                    },
                    image_url: {
                        type: ["string", "null"],
                        format: "uri",
                    },
                    display_order: {
                        type: "integer",
                        minimum: 0,
                    },
                },
            },
            Category: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        pattern: "^[a-fA-F0-9]{24}$",
                        description: "MongoDB ObjectId",
                        example: "507f1f77bcf86cd799439011",
                    },
                    name: {
                        type: "string",
                        example: "Electronics",
                    },
                    slug: {
                        type: "string",
                        example: "electronics",
                    },
                    description: {
                        type: "string",
                        example: "Electronic devices and accessories",
                    },
                    parent_id: {
                        type: ["string", "null"],
                        pattern: "^[a-fA-F0-9]{24}$",
                        example: null,
                    },
                    level: {
                        type: "integer",
                        minimum: 0,
                        example: 0,
                    },
                    status: {
                        type: "string",
                        enum: ["ACTIVE", "INACTIVE"],
                        example: "ACTIVE",
                    },
                    icon_url: {
                        type: ["string", "null"],
                        format: "uri",
                    },
                    image_url: {
                        type: ["string", "null"],
                        format: "uri",
                    },
                    display_order: {
                        type: "integer",
                        example: 0,
                    },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                },
                required: ["id", "name", "slug", "level", "status", "created_at", "updated_at"],
            },
            CategoryTree: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        pattern: "^[a-fA-F0-9]{24}$",
                    },
                    name: { type: "string" },
                    slug: { type: "string" },
                    level: { type: "integer" },
                    status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
                    children: {
                        type: "array",
                        items: { $ref: "#/components/schemas/CategoryTree" },
                    },
                },
                required: ["id", "name", "slug", "level", "status", "children"],
            },
            BreadcrumbItem: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        pattern: "^[a-fA-F0-9]{24}$",
                    },
                    name: { type: "string" },
                    slug: { type: "string" },
                    level: { type: "integer" },
                },
                required: ["id", "name", "slug", "level"],
            },
            CategoryResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Category" },
                },
                required: ["success", "data"],
            },
            CategoryTreeResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/CategoryTree" },
                    },
                },
                required: ["success", "data"],
            },
            CategoriesListResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Category" },
                    },
                },
                required: ["success", "data"],
            },
            BreadcrumbResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/BreadcrumbItem" },
                    },
                },
                required: ["success", "data"],
            },
            DeleteCategoryResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: {
                        type: "string",
                        example: "Category deleted successfully",
                    },
                },
                required: ["success", "message"],
            },

            // ✅ PRODUCT SCHEMAS
            CreateProductInput: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        minLength: 2,
                        maxLength: 200,
                        description: "Tên sản phẩm",
                        example: "Khăn giấy ướt",
                    },
                    slug: {
                        type: "string",
                        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                        description: "Slug URL-friendly",
                        example: "khan-giay-uot",
                    },
                    category_id: {
                        type: "string",
                        pattern: "^[a-fA-F0-9]{24}$",
                        description: "ID danh mục",
                        example: "507f1f77bcf86cd799439011",
                    },
                    brand: {
                        type: "string",
                        maxLength: 100,
                        description: "Thương hiệu",
                        example: "ABC Brand",
                    },
                    short_description: {
                        type: "string",
                        maxLength: 500,
                        description: "Mô tả ngắn",
                        example: "Khăn giấy ướt chất lượng cao",
                    },
                    description: {
                        type: "string",
                        maxLength: 2000,
                        description: "Mô tả chi tiết",
                        example: "Khăn giấy ướt với công nghệ kháng khuẩn...",
                    },
                    images: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                url: { type: "string", format: "uri" },
                                alt: { type: "string", maxLength: 200 },
                                is_primary: { type: "boolean", default: false },
                                sort_order: { type: "integer", minimum: 0, default: 0 },
                            },
                            required: ["url"],
                        },
                        description: "Danh sách hình ảnh",
                    },
                    search_keywords: {
                        type: "array",
                        items: { type: "string" },
                        maxItems: 10,
                        description: "Từ khóa tìm kiếm",
                        example: ["khăn giấy", "ướt", "kháng khuẩn"],
                    },
                    status: {
                        type: "string",
                        enum: ["ACTIVE", "INACTIVE"],
                        default: "ACTIVE",
                        description: "Trạng thái sản phẩm",
                    },
                },
                required: ["name", "category_id"],
            },
            UpdateProductInput: {
                type: "object",
                properties: {
                    name: { type: "string", minLength: 2, maxLength: 200 },
                    slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
                    category_id: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    brand: { type: "string", maxLength: 100 },
                    short_description: { type: "string", maxLength: 500 },
                    description: { type: "string", maxLength: 2000 },
                    images: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                url: { type: "string", format: "uri" },
                                alt: { type: "string", maxLength: 200 },
                                is_primary: { type: "boolean" },
                                sort_order: { type: "integer", minimum: 0 },
                            },
                        },
                    },
                    search_keywords: { type: "array", items: { type: "string" }, maxItems: 10 },
                    status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
                },
            },
            Product: {
                type: "object",
                properties: {
                    id: { type: "string", pattern: "^[a-fA-F0-9]{24}$", example: "507f1f77bcf86cd799439011" },
                    name: { type: "string", example: "Khăn giấy ướt" },
                    slug: { type: "string", example: "khan-giay-uot" },
                    category_id: { type: "string", pattern: "^[a-fA-F0-9]{24}$", example: "507f1f77bcf86cd799439012" },
                    brand: { type: "string", example: "ABC Brand" },
                    min_price: { type: "number", example: 150000 },
                    max_price: { type: "number", example: 200000 },
                    min_price_per_unit: { type: "number", example: 1500 },
                    max_price_per_unit: { type: "number", example: 2000 },
                    description: { type: "string", example: "Khăn giấy ướt chất lượng cao" },
                    short_description: { type: "string", example: "Khăn giấy ướt với công nghệ kháng khuẩn" },
                    images: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                url: { type: "string", format: "uri" },
                                alt: { type: "string" },
                                is_primary: { type: "boolean" },
                                sort_order: { type: "integer" },
                            },
                        },
                    },
                    search_keywords: { type: "array", items: { type: "string" } },
                    rating_avg: { type: "number", example: 4.5 },
                    rating_count: { type: "integer", example: 100 },
                    sold_count: { type: "integer", example: 500 },
                    status: { type: "string", enum: ["ACTIVE", "INACTIVE"], example: "ACTIVE" },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                },
                required: ["id", "name", "slug", "category_id", "status", "created_at", "updated_at"],
            },
            ProductListItem: {
                type: "object",
                properties: {
                    id: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    name: { type: "string" },
                    slug: { type: "string" },
                    category_id: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    brand: { type: "string" },
                    min_price: { type: "number" },
                    max_price: { type: "number" },
                    image: { type: "string", format: "uri" },
                    rating_avg: { type: "number" },
                    rating_count: { type: "integer" },
                    sold_count: { type: "integer" },
                    status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
                    created_at: { type: "string", format: "date-time" },
                },
                required: ["id", "name", "slug", "category_id", "status", "created_at"],
            },
            ProductDetail: {
                allOf: [
                    { $ref: "#/components/schemas/Product" },
                    {
                        type: "object",
                        properties: {
                            variants: {
                                type: "array",
                                items: { $ref: "#/components/schemas/VariantDetail" },
                            },
                        },
                    },
                ],
            },

            // ✅ VARIANT SCHEMAS
            CreateVariantInput: {
                type: "object",
                properties: {
                    size: {
                        type: "string",
                        minLength: 1,
                        maxLength: 50,
                        description: "Kích thước",
                        example: "20x25",
                    },
                    fabric_type: {
                        type: "string",
                        minLength: 1,
                        maxLength: 100,
                        description: "Loại vải",
                        example: "Vải Không Dệt",
                    },
                    stock: {
                        type: "object",
                        properties: {
                            available: { type: "integer", minimum: 0, default: 0 },
                            reserved: { type: "integer", minimum: 0, default: 0 },
                            sold: { type: "integer", minimum: 0, default: 0 },
                        },
                    },
                    status: {
                        type: "string",
                        enum: ["ACTIVE", "INACTIVE"],
                        default: "ACTIVE",
                    },
                },
                required: ["size", "fabric_type"],
            },
            UpdateVariantInput: {
                type: "object",
                properties: {
                    size: { type: "string", minLength: 1, maxLength: 50 },
                    fabric_type: { type: "string", minLength: 1, maxLength: 100 },
                    stock: {
                        type: "object",
                        properties: {
                            available: { type: "integer", minimum: 0 },
                            reserved: { type: "integer", minimum: 0 },
                            sold: { type: "integer", minimum: 0 },
                        },
                    },
                    status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
                },
            },
            Variant: {
                type: "object",
                properties: {
                    id: { type: "string", pattern: "^[a-fA-F0-9]{24}$", example: "507f1f77bcf86cd799439013" },
                    product_id: { type: "string", pattern: "^[a-fA-F0-9]{24}$", example: "507f1f77bcf86cd799439011" },
                    sku: { type: "string", example: "KGU-20x25-VKD" },
                    size: { type: "string", example: "20x25" },
                    fabric_type: { type: "string", example: "Vải Không Dệt" },
                    min_price: { type: "number", example: 150000 },
                    max_price: { type: "number", example: 200000 },
                    min_price_per_unit: { type: "number", example: 1500 },
                    max_price_per_unit: { type: "number", example: 2000 },
                    stock: {
                        type: "object",
                        properties: {
                            available: { type: "integer", example: 1000 },
                            reserved: { type: "integer", example: 50 },
                            sold: { type: "integer", example: 200 },
                        },
                    },
                    status: { type: "string", enum: ["ACTIVE", "INACTIVE"], example: "ACTIVE" },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                },
                required: ["id", "product_id", "sku", "size", "fabric_type", "status", "created_at", "updated_at"],
            },
            VariantDetail: {
                allOf: [
                    { $ref: "#/components/schemas/Variant" },
                    {
                        type: "object",
                        properties: {
                            units: {
                                type: "array",
                                items: { $ref: "#/components/schemas/VariantUnit" },
                            },
                        },
                    },
                ],
            },

            // ✅ VARIANT UNIT SCHEMAS
            CreateVariantUnitInput: {
                type: "object",
                properties: {
                    unit_type: {
                        type: "string",
                        enum: ["UNIT", "PACK", "BOX", "CARTON"],
                        default: "PACK",
                        description: "Loại đơn vị",
                    },
                    display_name: {
                        type: "string",
                        minLength: 1,
                        maxLength: 100,
                        description: "Tên hiển thị",
                        example: "Gói 100",
                    },
                    pack_size: {
                        type: "integer",
                        minimum: 1,
                        description: "Số lượng trong gói",
                        example: 100,
                    },
                    price_tiers: {
                        type: "array",
                        minItems: 1,
                        items: {
                            type: "object",
                            properties: {
                                min_qty: { type: "integer", minimum: 1 },
                                max_qty: { type: "integer", minimum: 1, nullable: true },
                                unit_price: { type: "number", minimum: 0 },
                            },
                            required: ["min_qty", "unit_price"],
                        },
                        description: "Bậc giá",
                    },
                    min_order_qty: { type: "integer", minimum: 1, default: 1 },
                    max_order_qty: { type: "integer", minimum: 1, nullable: true },
                    qty_step: { type: "integer", minimum: 1, default: 1 },
                    is_default: { type: "boolean", default: false },
                    currency: { type: "string", enum: ["VND", "USD", "EUR"], default: "VND" },
                },
                required: ["display_name", "pack_size", "price_tiers"],
            },
            UpdateVariantUnitInput: {
                type: "object",
                properties: {
                    unit_type: { type: "string", enum: ["UNIT", "PACK", "BOX", "CARTON"] },
                    display_name: { type: "string", minLength: 1, maxLength: 100 },
                    price_tiers: {
                        type: "array",
                        minItems: 1,
                        items: {
                            type: "object",
                            properties: {
                                min_qty: { type: "integer", minimum: 1 },
                                max_qty: { type: "integer", minimum: 1, nullable: true },
                                unit_price: { type: "number", minimum: 0 },
                            },
                            required: ["min_qty", "unit_price"],
                        },
                    },
                    min_order_qty: { type: "integer", minimum: 1 },
                    max_order_qty: { type: "integer", minimum: 1, nullable: true },
                    qty_step: { type: "integer", minimum: 1 },
                    is_default: { type: "boolean" },
                    currency: { type: "string", enum: ["VND", "USD", "EUR"] },
                },
            },
            VariantUnit: {
                type: "object",
                properties: {
                    id: { type: "string", pattern: "^[a-fA-F0-9]{24}$", example: "507f1f77bcf86cd799439014" },
                    variant_id: { type: "string", pattern: "^[a-fA-F0-9]{24}$", example: "507f1f77bcf86cd799439013" },
                    unit_type: { type: "string", enum: ["UNIT", "PACK", "BOX", "CARTON"], example: "PACK" },
                    display_name: { type: "string", example: "Gói 100" },
                    pack_size: { type: "integer", example: 100 },
                    price_tiers: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                min_qty: { type: "integer", example: 1 },
                                max_qty: { type: "integer", nullable: true, example: 10 },
                                unit_price: { type: "number", example: 180000 },
                            },
                        },
                    },
                    min_order_qty: { type: "integer", example: 1 },
                    max_order_qty: { type: "integer", nullable: true, example: 100 },
                    qty_step: { type: "integer", example: 1 },
                    is_default: { type: "boolean", example: true },
                    currency: { type: "string", enum: ["VND", "USD", "EUR"], example: "VND" },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                },
                required: ["id", "variant_id", "unit_type", "display_name", "pack_size", "price_tiers", "min_order_qty", "qty_step", "is_default", "currency", "created_at", "updated_at"],
            },
            CalculatePriceInput: {
                type: "object",
                properties: {
                    qty_packs: {
                        type: "integer",
                        minimum: 1,
                        description: "Số gói muốn mua",
                        example: 3,
                    },
                },
                required: ["qty_packs"],
            },
            PriceCalculationResult: {
                type: "object",
                properties: {
                    qty_packs: { type: "integer", example: 3 },
                    unit_price: { type: "number", example: 180000 },
                    total_price: { type: "number", example: 540000 },
                    total_items: { type: "integer", example: 300 },
                    price_per_unit: { type: "number", example: 1800 },
                    currency: { type: "string", example: "VND" },
                    pack_size: { type: "integer", example: 100 },
                    unit_display: { type: "string", example: "Gói 100" },
                },
                required: ["qty_packs", "unit_price", "total_price", "total_items", "price_per_unit", "currency", "pack_size", "unit_display"],
            },
            ReserveStockInput: {
                type: "object",
                properties: {
                    qty_items: {
                        type: "integer",
                        minimum: 1,
                        description: "Số lượng sản phẩm (cái)",
                        example: 300,
                    },
                },
                required: ["qty_items"],
            },

            // ✅ RESPONSE SCHEMAS
            ProductResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Product" },
                },
                required: ["success", "data"],
            },
            ProductDetailResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/ProductDetail" },
                },
                required: ["success", "data"],
            },
            ProductsListResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ProductListItem" },
                    },
                    pagination: {
                        type: "object",
                        properties: {
                            current_page: { type: "integer", example: 1 },
                            total_pages: { type: "integer", example: 5 },
                            total_items: { type: "integer", example: 100 },
                            per_page: { type: "integer", example: 20 },
                        },
                        required: ["current_page", "total_pages", "total_items", "per_page"],
                    },
                },
                required: ["success", "data", "pagination"],
            },
            VariantResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Variant" },
                },
                required: ["success", "data"],
            },
            VariantsListResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Variant" },
                    },
                },
                required: ["success", "data"],
            },
            VariantUnitResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/VariantUnit" },
                },
                required: ["success", "data"],
            },
            VariantUnitsListResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/VariantUnit" },
                    },
                },
                required: ["success", "data"],
            },
            CalculatePriceResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PriceCalculationResult" },
                },
                required: ["success", "data"],
            },
            StockResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "object",
                        properties: {
                            variant_id: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                            sku: { type: "string" },
                            stock: { $ref: "#/components/schemas/Variant" },
                        },
                    },
                },
                required: ["success", "data"],
            },
            DeleteResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Deleted successfully" },
                },
                required: ["success", "message"],
            },
        },
    },
    paths: {
        "/api/v1/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Register",
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/RegisterSuccessResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "409": { $ref: "#/components/responses/Conflict" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Login",
                security: [],
                description:
                    "Body trả `accessToken` + `user`. Refresh token được **Set-Cookie** tên `refreshToken`: **httpOnly**; **secure=true** khi `NODE_ENV=production`; **sameSite** = `lax` (môi trường thường) hoặc `none` (production, thường dùng kết hợp `secure` cho cross-site).",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LoginSuccessResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/auth/refresh": {
            post: {
                tags: ["Auth"],
                summary: "Refresh access token",
                security: [{ refreshTokenCookie: [] }],
                description:
                    "Bắt buộc có cookie `refreshToken` (hoặc nhập qua Swagger Authorize). Thành công: body có `accessToken` mới; server có thể Set-Cookie rotate refresh (cùng chính sách httpOnly / secure / sameSite như login).",
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/RefreshSuccessResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/api/v1/auth/logout": {
            post: {
                tags: ["Auth"],
                summary: "Logout",
                security: [],
                description:
                    "Cookie **không** bắt buộc. Nếu có `refreshToken`, server thu hồi (best effort) và **luôn** attempt clear cookie. Không dùng Bearer (trừ khi sau này bạn đổi code).",
                parameters: [
                    {
                        in: "cookie",
                        name: "refreshToken",
                        required: false,
                        schema: { type: "string" },
                        description: "httpOnly cookie; tùy chọn.",
                    },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LogoutSuccessResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/users/me": {
            get: {
                tags: ["Users"],
                summary: "Get current authenticated user",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UserProfileResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                },
            },
        },
        "/api/v1/users": {
            get: {
                tags: ["Users"],
                summary: "Get all users",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "page",
                        schema: { type: "integer", minimum: 1, default: 1 },
                    },
                    {
                        in: "query",
                        name: "limit",
                        schema: { type: "integer", minimum: 1, default: 20 },
                    },
                    {
                        in: "query",
                        name: "search",
                        schema: { type: "string" },
                    },
                    {
                        in: "query",
                        name: "status",
                        schema: { type: "string", enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] },
                    },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UsersListResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/users/{id}": {
            patch: {
                tags: ["Users"],
                summary: "Update user profile",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UserProfileInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UpdateUserResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "409": { $ref: "#/components/responses/Conflict" },
                },
            },
            delete: {
                tags: ["Users"],
                summary: "Delete user (soft delete)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/DeleteUserResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/api/v1/users/{id}/roles": {
            patch: {
                tags: ["Users"],
                summary: "Update user roles",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateUserRolesInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UpdateRolesResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/api/v1/user-addresses": {
            post: {
                tags: ["User Addresses"],
                summary: "Create a new address",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateUserAddressInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateUserAddressResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/user-addresses/{userId}": {
            get: {
                tags: ["User Addresses"],
                summary: "Get all addresses for a user",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "userId",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                        description: "User ID",
                    },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UserAddressListResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/api/v1/user-addresses/{userId}/{addressId}": {
            patch: {
                tags: ["User Addresses"],
                summary: "Update an address",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "userId",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                    {
                        in: "path",
                        name: "addressId",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateUserAddressInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UpdateUserAddressResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                },
            },
            delete: {
                tags: ["User Addresses"],
                summary: "Delete an address",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "userId",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                    {
                        in: "path",
                        name: "addressId",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/DeleteUserAddressResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/api/v1/user-addresses/{userId}/{addressId}/set-default": {
            patch: {
                tags: ["User Addresses"],
                summary: "Set address as default",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "userId",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                    {
                        in: "path",
                        name: "addressId",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UpdateUserAddressResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/api/v1/categories/tree": {
            get: {
                tags: ["Categories"],
                summary: "Get category tree (hierarchical structure)",
                security: [],
                description: "Get all categories organized in a tree structure with parent-child relationships.",
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CategoryTreeResponse" },
                            },
                        },
                    },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/categories/all": {
            get: {
                tags: ["Categories"],
                summary: "Get all categories",
                security: [],
                description: "Get all categories as a flat list.",
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CategoriesListResponse" },
                            },
                        },
                    },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/categories/slug/{slug}": {
            get: {
                tags: ["Categories"],
                summary: "Get category by slug",
                security: [],
                parameters: [
                    {
                        in: "path",
                        name: "slug",
                        required: true,
                        schema: { type: "string" },
                        description: "Category slug",
                    },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CategoryResponse" },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/categories/{categoryId}": {
            get: {
                tags: ["Categories"],
                summary: "Get category by ID",
                security: [],
                parameters: [
                    {
                        in: "path",
                        name: "categoryId",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                        description: "Category ID",
                    },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CategoryResponse" },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            post: {
                tags: ["Categories"],
                summary: "Create category",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateCategoryInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CategoryResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "409": { $ref: "#/components/responses/Conflict" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            patch: {
                tags: ["Categories"],
                summary: "Update category",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "categoryId",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateCategoryInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CategoryResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "409": { $ref: "#/components/responses/Conflict" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            delete: {
                tags: ["Categories"],
                summary: "Delete category (soft delete)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "categoryId",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/DeleteCategoryResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/categories/{categoryId}/breadcrumb": {
            get: {
                tags: ["Categories"],
                summary: "Get category breadcrumb",
                security: [],
                parameters: [
                    {
                        in: "path",
                        name: "categoryId",
                        required: true,
                        schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                    },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/BreadcrumbResponse" },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },

        // ✅ PRODUCT PATHS
        "/api/v1/products": {
            get: {
                tags: ["Products"],
                summary: "Get all products",
                security: [],
                parameters: [
                    { in: "query", name: "page", schema: { type: "integer", minimum: 1, default: 1 } },
                    { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
                    { in: "query", name: "category_id", schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                    { in: "query", name: "min_price", schema: { type: "integer", minimum: 0 } },
                    { in: "query", name: "max_price", schema: { type: "integer", minimum: 0 } },
                    { in: "query", name: "status", schema: { type: "string", enum: ["ACTIVE", "INACTIVE"] } },
                    { in: "query", name: "search", schema: { type: "string" } },
                    { in: "query", name: "sortBy", schema: { type: "string", enum: ["popular", "rating", "price_asc", "price_desc", "newest"], default: "newest" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ProductsListResponse" },
                            },
                        },
                    },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            post: {
                tags: ["Products"],
                summary: "Create product",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateProductInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ProductResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/products/search": {
            get: {
                tags: ["Products"],
                summary: "Search products",
                security: [],
                parameters: [
                    { in: "query", name: "q", schema: { type: "string", minLength: 2, maxLength: 100 }, required: true },
                    { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 50, default: 20 } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ProductsListResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/products/category/{categoryId}": {
            get: {
                tags: ["Products"],
                summary: "Get products by category",
                security: [],
                parameters: [
                    { in: "path", name: "categoryId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                    { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ProductsListResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/products/slug/{slug}": {
            get: {
                tags: ["Products"],
                summary: "Get product by slug",
                security: [],
                parameters: [
                    { in: "path", name: "slug", required: true, schema: { type: "string" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ProductDetailResponse" },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/products/{productId}": {
            get: {
                tags: ["Products"],
                summary: "Get product by ID",
                security: [],
                parameters: [
                    { in: "path", name: "productId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ProductDetailResponse" },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            patch: {
                tags: ["Products"],
                summary: "Update product",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "productId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateProductInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ProductResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            delete: {
                tags: ["Products"],
                summary: "Delete product",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "productId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/DeleteResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },

        // ✅ VARIANT PATHS
        "/api/v1/products/{productId}/variants": {
            get: {
                tags: ["Variants"],
                summary: "Get variants by product",
                security: [],
                parameters: [
                    { in: "path", name: "productId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/VariantsListResponse" },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            post: {
                tags: ["Variants"],
                summary: "Create variant",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "productId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateVariantInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/VariantResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variants/id/{variantId}": {
            get: {
                tags: ["Variants"],
                summary: "Get variant by ID",
                security: [],
                parameters: [
                    { in: "path", name: "variantId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/VariantResponse" },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            patch: {
                tags: ["Variants"],
                summary: "Update variant",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "variantId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateVariantInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/VariantResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            delete: {
                tags: ["Variants"],
                summary: "Delete variant",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "variantId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/DeleteResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variants/id/{variantId}/stock": {
            get: {
                tags: ["Variants"],
                summary: "Check variant stock",
                security: [],
                parameters: [
                    { in: "path", name: "variantId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/StockResponse" },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variants/id/{variantId}/max-order-qty": {
            get: {
                tags: ["Variants"],
                summary: "Get max order quantity",
                security: [],
                parameters: [
                    { in: "path", name: "variantId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                    { in: "query", name: "pack_size", schema: { type: "integer", minimum: 1, default: 100 } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: {
                                            type: "object",
                                            properties: {
                                                variant_id: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                                                max_packs: { type: "integer", example: 5 },
                                                max_items: { type: "integer", example: 500 },
                                                pack_size: { type: "integer", example: 100 },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variants/id/{variantId}/reserve-stock": {
            post: {
                tags: ["Variants"],
                summary: "Reserve stock",
                security: [],
                parameters: [
                    { in: "path", name: "variantId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ReserveStockInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/StockResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variants/id/{variantId}/complete-sale": {
            post: {
                tags: ["Variants"],
                summary: "Complete sale",
                security: [],
                parameters: [
                    { in: "path", name: "variantId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ReserveStockInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/StockResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variants/id/{variantId}/release-stock": {
            post: {
                tags: ["Variants"],
                summary: "Release reserved stock",
                security: [],
                parameters: [
                    { in: "path", name: "variantId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ReserveStockInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/StockResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },

        // ✅ VARIANT UNIT PATHS
        "/api/v1/variant-units/{unitId}": {
            get: {
                tags: ["Variant Units"],
                summary: "Get variant unit by ID",
                security: [],
                parameters: [
                    { in: "path", name: "unitId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/VariantUnitResponse" },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            patch: {
                tags: ["Variant Units"],
                summary: "Update variant unit",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "unitId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateVariantUnitInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/VariantUnitResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            delete: {
                tags: ["Variant Units"],
                summary: "Delete variant unit",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "unitId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/DeleteResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variants/{variantId}/units": {
            get: {
                tags: ["Variant Units"],
                summary: "Get units by variant",
                security: [],
                parameters: [
                    { in: "path", name: "variantId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/VariantUnitsListResponse" },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
            post: {
                tags: ["Variant Units"],
                summary: "Create variant unit",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "variantId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateVariantUnitInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/VariantUnitResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/Forbidden" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variants/{variantId}/units/default": {
            get: {
                tags: ["Variant Units"],
                summary: "Get default unit for variant",
                security: [],
                parameters: [
                    { in: "path", name: "variantId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/VariantUnitResponse" },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variant-units/{unitId}/price-tiers": {
            get: {
                tags: ["Variant Units"],
                summary: "Get price tiers",
                security: [],
                parameters: [
                    { in: "path", name: "unitId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    tier_number: { type: "integer", example: 1 },
                                                    min_qty: { type: "integer", example: 1 },
                                                    max_qty: { type: "integer", nullable: true, example: 10 },
                                                    price: { type: "number", example: 180000 },
                                                    price_per_unit: { type: "number", example: 1800 },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variant-units/{unitId}/calculate-price": {
            post: {
                tags: ["Variant Units"],
                summary: "Calculate price",
                security: [],
                parameters: [
                    { in: "path", name: "unitId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CalculatePriceInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CalculatePriceResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variant-units/{unitId}/max-orderable-qty": {
            get: {
                tags: ["Variant Units"],
                summary: "Get max orderable quantity",
                security: [],
                parameters: [
                    { in: "path", name: "unitId", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
                ],
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: {
                                            type: "object",
                                            properties: {
                                                unit_id: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
                                                max_orderable_packs: { type: "integer", example: 999 },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
        "/api/v1/variant-units/validate-tiers": {
            post: {
                tags: ["Variant Units"],
                summary: "Validate price tiers",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "array",
                                minItems: 1,
                                items: {
                                    type: "object",
                                    properties: {
                                        min_qty: { type: "integer", minimum: 1 },
                                        max_qty: { type: "integer", minimum: 1, nullable: true },
                                        unit_price: { type: "number", minimum: 0 },
                                    },
                                    required: ["min_qty", "unit_price"],
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: {
                                            type: "object",
                                            properties: {
                                                valid: { type: "boolean", example: true },
                                                message: { type: "string", example: "Price tiers are valid" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "500": { $ref: "#/components/responses/InternalError" },
                },
            },
        },
    },
};

module.exports = swaggerSpec;