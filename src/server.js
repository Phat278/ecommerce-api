import "dotenv/config";
import express from "express";
import prisma from "./lib/prisma.js";

import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import orderRouter from "./routes/order.routes.js";
import authMiddleware from "./middleware/auth.middleware.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Kiểm tra API và kết nối database
app.get("/health", async(req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;

        return res.status(200).json({
            status: "ok",
            service: "ecommerce-api",
            database: "connected",
        });
    } catch (error) {
        console.error("Health check thất bại:", error);

        return res.status(500).json({
            status: "error",
            service: "ecommerce-api",
            database: "disconnected",
        });
    }
});

// Gắn các nhóm API
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);

// Lấy thông tin tài khoản đang đăng nhập
app.get("/api/auth/me", authMiddleware, (req, res) => {
    return res.status(200).json({
        user: req.user,
    });
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});