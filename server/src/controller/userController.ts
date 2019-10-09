import { Request, Response, NextFunction } from "express";
import { getRepository, getConnection } from "typeorm";
import jwt from "jsonwebtoken";

import { User } from "../entity/user";
import { Pokemon } from "../entity/pokedex";

import { pick } from "./../utils/helper";

function verify(username: string, password: string) {
        let errMsg: string;

        if (!username || !password) {
            errMsg = "存在空的用户名或密码, 请填写完整";
        } else if (username.length <= 0 || username.length > 10) {
            errMsg = "用户名长度不再接受范围(0-10)内";
        } else if (password.length < 6 || password.length > 12) {
            errMsg = "密码长度不再接受范围(6-16)内";
        }

        return errMsg;
}

export async function postLogin(request: Request, response: Response, next: NextFunction) {
    try {

        const { username, password } = request.body;
        let errMsg = verify(username, password);

        const userData = await getRepository(User).findOne({username});
        if (!userData) {
            errMsg = "未找到用户";
        } else if (userData.password !== password) {
            errMsg = "密码错误";
        }

        if (errMsg) {
            next({status: 400, message: `登录失败: ${errMsg}`});
        }

        response.locals.userInfo = userData;
        next();
    } catch (error) {
        next(error.message);
    }
}

export async function postRegister(request: Request, response: Response, next: NextFunction) {
    try {
        const { username, password } = request.body;
        let errMsg = verify(username, password);

        const userData = await getRepository(User).findOne({username});

        if (userData) {
            errMsg = "该用户已注册";
        }

        if (errMsg) {
            next({status: 400, message: `注册失败: ${errMsg}`});
        }

        const userRepo = getRepository(User);

        const newUser = new User();
        newUser.username = username;
        newUser.password = password;
        const newUserData = await userRepo.save(newUser);

        response.locals.userInfo = newUserData;
        next();
    } catch (error) {
        next(error.message);
    }
}

export function generateJWT(request: Request, response: Response) {
    const userInfo = response.locals.userInfo;
    const message = request.path === "/login"
        ? "登录成功" : "注册成功";

    const expires = 1000 * 60 * 60;

    const token = jwt.sign({ uuid: userInfo.id.toString() }, "blur", {
        expiresIn: expires / 1000,
    });

    const {
        id,
        password,
        ...userData
    } = userInfo;

    response.json({
        message,
        userInfo: userData,
        token,
        expires
    });
}

async function queryUser(uuid: string) {
    try {
        const userRepo = getRepository(User);

        const data = await userRepo.createQueryBuilder("user")
            .leftJoinAndSelect("user.favoritePokemons", "favoritePokemons")
            .where("user.id = :uuid", {uuid})
            .getOne();

        return data;
    } catch (error) {
        throw error;
    }
}

export async function getFavoritePokemons(request: Request, response: Response, next: NextFunction) {
    try {
        const userData = await queryUser(response.locals.uuid);

        response.json(userData.favoritePokemons);
    } catch (error) {
        next(error);
    }
}

export async function postFavoritePokemons(request: Request, response: Response, next: NextFunction) {
    try {
        const { pokemonName } = request.params;

        const userData = await queryUser(response.locals.uuid);
        const myPokemons = userData.favoritePokemons;
        const storedPokemon = await getRepository(Pokemon).findOne({pokeName: pokemonName });

        if (!storedPokemon) {
            next({status: 400, message: `未找到该宝可梦,请输入正确的名字！`});
        }

        const storedPokemonIndex = myPokemons.findIndex(pokemon => pokemon.id === storedPokemon.id);

        if (storedPokemonIndex > -1) {
            next({status: 400, message: `您已经收藏了${storedPokemon.pokeName}!`});
        }

        myPokemons.push(storedPokemon);

        response.locals.updateData = { favoritePokemons: myPokemons };
        next();
    } catch (error) {
        next(error);
    }
}

export async function deleteFavoritePokemons(request: Request, response: Response, next: NextFunction) {
    try {
        const { pokemonName } = request.params;

        const userData = await queryUser(response.locals.uuid);
        const myPokemons = userData.favoritePokemons;
        const deletePokemon = await getRepository(Pokemon).findOne({pokeName: pokemonName});

        const deletePokemonIndex = myPokemons.findIndex(pokemon => pokemon.id === deletePokemon.id);

        if (deletePokemonIndex === -1) {
            next({status: 400, message: `您没有收藏${deletePokemon.pokeName}!`});
        }

        myPokemons.splice(deletePokemonIndex, 1);

        response.locals.updateData = { favoritePokemons: myPokemons };
        next();
    } catch (error) {
        next(error);
    }
}

export async function getUser(request: Request, response: Response) {
    console.log(request.url);
    const data = await queryUser(response.locals.uuid);
    response.json(data);
}

export async function putUser(request: Request, response: Response, next: NextFunction) {
    const bodyData = pick(request.body, ["username", "password", "profession", "avatar", "quotes"]);
    response.locals.updateData = bodyData;
    next();
}

export async function update(request: Request, response: Response, next: NextFunction) {
    try {
        const { updateData, uuid } = response.locals;
        const userRepo = getRepository(User);

        let userData = await userRepo.findOne({id: uuid});

        userData = {
            ...userData,
            ...updateData
        };

        await userRepo.save(userData);

        response.json({message: "操作成功!"});
    } catch (error) {
        next(error);
    }
}