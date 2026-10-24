import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = Router();

// Đăng ký tài khoản
router.post("/register", async(req, res) => {
    try {
        const { username, fullname, password } = req.body;

        if (!username || !fullname || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập username, fullname và password.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Mật khẩu phải có ít nhất 8 ký tự.",
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Username đã tồn tại.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                fullname,
                password: hashedPassword,
                roleid: 1,
                mid: 1,
            },
            select: {
                uid: true,
                username: true,
                fullname: true,
                roleid: true,
                mid: true,
            },
        });

        return res.status(201).json({
            message: "Đăng ký thành công.",
            user,
        });
    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            message: "Lỗi máy chủ khi đăng ký.",
        });
    }
});

// Đăng nhập
router.post("/login", async(req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập username và password.",
            });
        }

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return res.status(401).json({
                message: "Username hoặc password không đúng.",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Username hoặc password không đúng.",
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Chưa cấu hình JWT_SECRET trong file .env.",
            });
        }

        const token = jwt.sign({
                uid: user.uid,
                username: user.username,
                roleid: user.roleid,
            },
            process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d",
            }
        );

        return res.status(200).json({
            message: "Đăng nhập thành công.",
            token,
            user: {
                uid: user.uid,
                username: user.username,
                fullname: user.fullname,
                roleid: user.roleid,
                mid: user.mid,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Lỗi máy chủ khi đăng nhập.",
        });
    }
});

export default router;