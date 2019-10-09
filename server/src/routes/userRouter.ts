import express from "express";

import auth from "../middlewares/auth";
import {
    postLogin,
    postRegister,
    getFavoritePokemons,
    postFavoritePokemons,
    deleteFavoritePokemons,
    putUser,
    getUser,
    update,
    generateJWT
}  from "../controller/userController";

const router = express.Router();

router.post("/login",  postLogin, generateJWT);
router.post("/register", postRegister, generateJWT);

router.get("/favorite_pokemons", auth, getFavoritePokemons);
router.post("/favorite_pokemons/:pokemonName", auth, postFavoritePokemons, update);
router.delete("/favorite_pokemons/:pokemonName", auth, deleteFavoritePokemons, update);

router.get("/:userId", auth, getUser);
router.put("/:userId", auth, putUser, update);

export default router;
