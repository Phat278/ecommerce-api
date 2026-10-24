import jwt from "jsonwebtoken";

function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Bạn cần đăng nhập để truy cập tài nguyên này.",
        });
    }

    const token = authorization.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        return next();
    } catch (error) {
        return res.status(401).json({
            message: "Token không hợp lệ hoặc đã hết hạn.",
        });
    }
}

export default authMiddleware;