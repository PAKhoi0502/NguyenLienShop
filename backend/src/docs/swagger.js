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
    },
};

module.exports = swaggerSpec;