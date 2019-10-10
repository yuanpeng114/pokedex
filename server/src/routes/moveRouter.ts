import express, { Request, Response } from "express";

import * as moveController  from "../controller/moveController";

const router = express.Router();

router.get("/", moveController.getMoveList);
router.get("/:name", moveController.getMoveDetail);

export default router;
