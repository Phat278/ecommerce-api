import express from "express";
import prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// Tạo đơn hàng cho người dùng đang đăng nhập
router.post("/", authMiddleware, async(req, res) => {
    try {
        const uid = Number(req.user.uid);
        const { items } = req.body;

        if (!Number.isInteger(uid)) {
            return res.status(401).json({
                message: "Thông tin người dùng trong token không hợp lệ",
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Đơn hàng phải có ít nhất một sản phẩm",
            });
        }

        // Kiểm tra dữ liệu và gộp sản phẩm trùng mã
        const quantitiesByPid = new Map();

        for (const item of items) {
            const pid = Number(item.pid);
            const qty = Number(item.qty);

            if (!Number.isInteger(pid) || pid <= 0) {
                return res.status(400).json({
                    message: "Mã sản phẩm phải là số nguyên dương",
                });
            }

            if (!Number.isInteger(qty) || qty <= 0) {
                return res.status(400).json({
                    message: "Số lượng sản phẩm phải là số nguyên dương",
                });
            }

            quantitiesByPid.set(
                pid,
                (quantitiesByPid.get(pid) || 0) + qty
            );
        }

        const orderItems = Array.from(quantitiesByPid, ([pid, qty]) => ({
            pid,
            qty,
        }));

        const order = await prisma.$transaction(async(tx) => {
            const pids = orderItems.map((item) => item.pid);

            const products = await tx.product.findMany({
                where: {
                    pid: { in: pids,
                    },
                },
            });

            if (products.length !== orderItems.length) {
                const foundPids = new Set(products.map((product) => product.pid));
                const missingItem = orderItems.find(
                    (item) => !foundPids.has(item.pid)
                );

                const error = new Error(
                    `Không tìm thấy sản phẩm có mã ${missingItem.pid}`
                );
                error.code = "PRODUCT_NOT_FOUND";
                throw error;
            }

            const productsByPid = new Map(
                products.map((product) => [product.pid, product])
            );

            // Trừ tồn kho. Nếu thiếu hàng, toàn bộ giao dịch sẽ bị hủy.
            for (const item of orderItems) {
                const result = await tx.product.updateMany({
                    where: {
                        pid: item.pid,
                        quantity: {
                            gte: item.qty,
                        },
                    },
                    data: {
                        quantity: {
                            decrement: item.qty,
                        },
                    },
                });

                if (result.count !== 1) {
                    const error = new Error(
                        `Sản phẩm mã ${item.pid} không đủ số lượng trong kho`
                    );
                    error.code = "INSUFFICIENT_STOCK";
                    throw error;
                }
            }

            // Tạo đơn hàng, chi tiết đơn và shipment mặc định
            return tx.order.create({
                data: {
                    uid,
                    orderDetails: {
                        create: orderItems.map((item) => ({
                            qty: item.qty,
                            unit_price: productsByPid.get(item.pid).price,
                            product: {
                                connect: {
                                    pid: item.pid,
                                },
                            },
                        })),
                    },
                    shipments: {
                        create: {
                            status: "Pending",
                        },
                    },
                },
                include: {
                    orderDetails: {
                        include: {
                            product: true,
                        },
                    },
                    shipments: true,
                },
            });
        });

        return res.status(201).json({
            message: "Tạo đơn hàng thành công",
            order,
        });
    } catch (error) {
        console.error("Lỗi tạo đơn hàng:", error);

        if (error.code === "PRODUCT_NOT_FOUND") {
            return res.status(404).json({
                message: error.message,
            });
        }

        if (error.code === "INSUFFICIENT_STOCK") {
            return res.status(409).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Lỗi máy chủ khi tạo đơn hàng",
        });
    }
});

// Xem các đơn hàng của người dùng đang đăng nhập
router.get("/", authMiddleware, async(req, res) => {
    try {
        const uid = Number(req.user.uid);

        if (!Number.isInteger(uid)) {
            return res.status(401).json({
                message: "Thông tin người dùng trong token không hợp lệ",
            });
        }

        const orders = await prisma.order.findMany({
            where: {
                uid,
            },
            orderBy: {
                createat: "desc",
            },
            include: {
                orderDetails: {
                    include: {
                        product: true,
                    },
                },
                shipments: true,
            },
        });

        return res.status(200).json({
            orders,
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách đơn hàng:", error);

        return res.status(500).json({
            message: "Lỗi máy chủ khi lấy danh sách đơn hàng",
        });
    }
});

export default router;