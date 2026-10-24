import { Router } from "express";
import prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// Lấy danh sách sản phẩm
router.get("/", async(req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { pid: "asc" },
        });

        return res.status(200).json(products);
    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            message: "Lỗi máy chủ khi lấy danh sách sản phẩm.",
        });
    }
});

// Lấy một sản phẩm theo ID
router.get("/:id", async(req, res) => {
    try {
        const pid = Number(req.params.id);

        if (!Number.isInteger(pid) || pid <= 0) {
            return res.status(400).json({
                message: "ID sản phẩm không hợp lệ.",
            });
        }

        const product = await prisma.product.findUnique({
            where: { pid },
        });

        if (!product) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm.",
            });
        }

        return res.status(200).json(product);
    } catch (error) {
        console.error("Get product error:", error);

        return res.status(500).json({
            message: "Lỗi máy chủ khi lấy sản phẩm.",
        });
    }
});

// Tạo sản phẩm mới — yêu cầu JWT
router.post("/", authMiddleware, async(req, res) => {
    try {
        const { pname, price, quantity } = req.body;
        const numericPrice = Number(price);

        if (
            typeof pname !== "string" ||
            pname.trim() === "" ||
            !Number.isFinite(numericPrice) ||
            numericPrice < 0 ||
            !Number.isInteger(quantity) ||
            quantity < 0
        ) {
            return res.status(400).json({
                message: "Tên, giá hoặc số lượng sản phẩm không hợp lệ.",
            });
        }

        const product = await prisma.product.create({
            data: {
                pname: pname.trim(),
                price: numericPrice.toFixed(2),
                quantity,
            },
        });

        return res.status(201).json({
            message: "Tạo sản phẩm thành công.",
            product,
        });
    } catch (error) {
        console.error("Create product error:", error);

        return res.status(500).json({
            message: "Lỗi máy chủ khi tạo sản phẩm.",
        });
    }
});

// Cập nhật sản phẩm — yêu cầu JWT
router.put("/:id", authMiddleware, async(req, res) => {
    try {
        const pid = Number(req.params.id);

        if (!Number.isInteger(pid) || pid <= 0) {
            return res.status(400).json({
                message: "ID sản phẩm không hợp lệ.",
            });
        }

        const existingProduct = await prisma.product.findUnique({
            where: { pid },
        });

        if (!existingProduct) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm.",
            });
        }

        const { pname, price, quantity } = req.body;
        const data = {};

        if (pname !== undefined) {
            if (typeof pname !== "string" || pname.trim() === "") {
                return res.status(400).json({
                    message: "Tên sản phẩm không hợp lệ.",
                });
            }

            data.pname = pname.trim();
        }

        if (price !== undefined) {
            const numericPrice = Number(price);

            if (!Number.isFinite(numericPrice) || numericPrice < 0) {
                return res.status(400).json({
                    message: "Giá sản phẩm không hợp lệ.",
                });
            }

            data.price = numericPrice.toFixed(2);
        }

        if (quantity !== undefined) {
            if (!Number.isInteger(quantity) || quantity < 0) {
                return res.status(400).json({
                    message: "Số lượng sản phẩm không hợp lệ.",
                });
            }

            data.quantity = quantity;
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                message: "Hãy gửi ít nhất một trường cần cập nhật.",
            });
        }

        const product = await prisma.product.update({
            where: { pid },
            data,
        });

        return res.status(200).json({
            message: "Cập nhật sản phẩm thành công.",
            product,
        });
    } catch (error) {
        console.error("Update product error:", error);

        return res.status(500).json({
            message: "Lỗi máy chủ khi cập nhật sản phẩm.",
        });
    }
});

// Xóa sản phẩm — yêu cầu JWT
router.delete("/:id", authMiddleware, async(req, res) => {
    try {
        const pid = Number(req.params.id);

        if (!Number.isInteger(pid) || pid <= 0) {
            return res.status(400).json({
                message: "ID sản phẩm không hợp lệ.",
            });
        }

        const existingProduct = await prisma.product.findUnique({
            where: { pid },
        });

        if (!existingProduct) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm.",
            });
        }

        await prisma.product.delete({
            where: { pid },
        });

        return res.status(200).json({
            message: "Xóa sản phẩm thành công.",
        });
    } catch (error) {
        console.error("Delete product error:", error);

        return res.status(500).json({
            message: "Lỗi máy chủ khi xóa sản phẩm.",
        });
    }
});

export default router;