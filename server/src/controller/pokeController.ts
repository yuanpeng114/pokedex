import { Request, Response } from "express";
import { getRepository, In } from "typeorm";
import { Pokemon, Type, Move } from "../entity/pokedex";
import { NextFunction } from "express-serve-static-core";

const moveMainTypeToFirst = (typeList: Type[], mainTypeName: string) => {
    const targetIndex = typeList.findIndex(item => item.typeName === mainTypeName);
    const oldFirst = typeList[0];
    typeList[0] = typeList[targetIndex];
    typeList[targetIndex] = oldFirst;
    return typeList;
};

const getCleanTypes = (typeList: Type[], mainTypeName: string) => (
    moveMainTypeToFirst(typeList, mainTypeName).map(type => type.typeName)
);

export async function getPokeList(request: Request, response: Response, next: NextFunction) {
    try {
        let {pageIndex, pageSize} = request.query;

        const pokemonRepo = getRepository(Pokemon);

        pageIndex = pageIndex ? pageIndex - 1 : 0;
        pageSize = pageSize ? pageSize : 10;

        const total = await pokemonRepo.count();
        const pokemonList = await pokemonRepo
            .createQueryBuilder("pokemon")
            .select(["pokemon.id", "pokemon.ndex", "pokemon.pokeName", "pokemon.mainType", "pokemon.avatar"])
            .leftJoinAndSelect("pokemon.types", "type")
            .take(pageSize)
            .skip(pageSize * pageIndex)
            .getMany();

        const list = pokemonList.map(pokemon => {
            const types = getCleanTypes(pokemon.types, pokemon.mainType);
            return {
                types,
                id: pokemon.id,
                name: pokemon.pokeName,
                avatar: pokemon.avatar,
                ndex: pokemon.ndex,
            };
        });

        response.json({
            list,
            total
        });
    } catch (error) {
        next(error);
    }
}

export async function getPokeDetail(request: Request, response: Response, next: NextFunction) {
    try {
        const pokemonRepo = getRepository(Pokemon);
        const currentPoke = request.params.name;
        const isNdex = /^#\d{3,}/.test(currentPoke);
        const searchName = isNdex ? "ndex" : "pokeName";

        const pokemonData = await pokemonRepo
            .createQueryBuilder("pokemon")
            .innerJoinAndSelect("pokemon.types", "type")
            .innerJoinAndSelect("pokemon.stats", "stats")
            .innerJoinAndSelect("pokemon.family", "family")
            .innerJoinAndSelect("pokemon.pokemonMoves", "pokemonMove")
            .innerJoinAndSelect("pokemonMove.move", "move")
            .where(`pokemon.${searchName} = :value`, {value: currentPoke})
            .getOne();

        if (!pokemonData) {
            return next({statusCode: 400, message: "未找到该宝可梦,请输入正确的名字或编号!"});
        }

        const family = await pokemonRepo
                .createQueryBuilder("pokemon")
                .select(["pokemon.pokeName", "pokemon.avatar", "pokemon.ndex"])
                .where("pokemon.pokeName IN (:names)", { names: pokemonData.family.familyMembers})
                .orderBy("pokemon.id")
                .getMany();

        const types = getCleanTypes(pokemonData.types, pokemonData.mainType);

        interface MoveWithLearnBy {
            learnBy: string;
            move: { id: number, moveName: string, typeName: string };
        }

        interface LearnByWithMoveList {
            learnBy: string;
            list: { id: number, moveName: string, typeName: string }[];
        }

        const moves: MoveWithLearnBy[] = [];

        for (const pokemonMove of pokemonData.pokemonMoves) {
            const curMove = await await getRepository(Move)
            .createQueryBuilder("move")
            .innerJoinAndSelect("move.type", "type")
            .where("move.moveName = :name", { name: pokemonMove.move.moveName })
            .getOne();

            moves.push( {
                learnBy: pokemonMove.learnBy,
                move: {id: pokemonMove.move.id, moveName: pokemonMove.move.moveName, typeName: curMove.type.typeName}
            });
        }

        const groupMove = (moves: MoveWithLearnBy[]) => {
            const newMoves: LearnByWithMoveList[] = [
                { learnBy: "可学会的招式", list: []},
                { learnBy: "能使用的招式学习器", list: []},
                { learnBy: "蛋招式", list: []},
                { learnBy: "教授招式", list: []},
                { learnBy: "特殊招式", list: []},
                { learnBy: "只在集换式卡片游戏中", list: []},
            ];

            moves.forEach(move => {
                const learnByIndex = newMoves.findIndex(newMove => newMove.learnBy === move.learnBy);
                if (learnByIndex > -1) {
                    newMoves[learnByIndex].list.push(move.move);
                } else {
                    newMoves[newMoves.length] = {
                        learnBy: move.learnBy,
                        list: [move.move]
                    };
                }
            });

            return newMoves;
        };

        const newMoves = groupMove(moves);

        response.json({
            family,
            types,
            id: pokemonData.id,
            name: pokemonData.pokeName,
            moves: newMoves,
            ndex: pokemonData.ndex,
            stats: pokemonData.stats,
            appearance: pokemonData.appearance,
            avatar: pokemonData.avatar
        });
    } catch (error) {
        next(error);
    }

}