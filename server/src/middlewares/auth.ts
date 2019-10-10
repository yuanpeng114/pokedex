import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export default function auth(request: Request, response: Response, next: NextFunction) {
    try {
        const token = request.headers.authorization;
        const result = jwt.verify(token, "blur");
        response.locals.uuid = (result as {uuid: string}).uuid;
        next();
    } catch (error) {
        let message = error.message;

        if (message === "jwt expired") {
            message = "您的用户凭证已过期, 请重新登录!";
        }

        if (message === "invalid token" || message === "jwt must be provided") {
            message = "请先登录!";
        }

        next({ message, status: 401 });
    }
}