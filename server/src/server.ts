import express, { Request, Response } from "express";
import { createConnection } from "typeorm";
import bodyParser from "body-parser";

import pokeRouter from "./routes/pokeRouter";
import moveRouter from "./routes/moveRouter";
import userRouter from "./routes/userRouter";
import { NextFunction } from "connect";
import HttpException from "./utils/httpException";

createConnection().then(async connection => {
    const app = express();

    app.use(function(req, res, next) {
        const allowedOrigins = [
            "http://localhost:3000",
            "http://192.168.168.102:3000",
            "http://192.168.2.44:3000",
        ];
        const origin = req.get("origin");

        if (allowedOrigins.indexOf(origin) > -1) {
            res.header("Access-Control-Allow-Origin", origin);
        }

        res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(express.static(__dirname));

    app.use("/api/pokemons", pokeRouter);
    app.use("/api/moves", moveRouter);
    app.use("/api/user", userRouter);

    app.use(function (err: HttpException, req: Request, res: Response, next: NextFunction) {
        const statusCode = err.status ? err.status : 500;
        const errMsg = err.message;
        res.status(statusCode).send({message: errMsg});
    });

    app.listen(4000, () => console.log("server is listen in 4000"));
}).catch(error => console.log("TypeORM connection error: ", error));