import express, { Request, Response } from "express";

import * as pokeController  from "../controller/pokeController";

const router = express.Router();

router.get("/", pokeController.getPokeList);
router.get("/:name", pokeController.getPokeDetail);

export default router;
