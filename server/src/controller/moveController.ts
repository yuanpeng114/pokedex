import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Pokemon, Move, Type } from "../entity/pokedex";

export async function getMoveList(request: Request, response: Response) {
    try {
        let { pageIndex,  pageSize } = request.query;
        console.log(request.query);
        const moveRepo = getRepository(Move);

        pageIndex = pageIndex ? pageIndex - 1 : 0;
        pageSize = pageSize ? pageSize : 10;

        const total = await moveRepo.count();
        const data = await moveRepo
            .createQueryBuilder("move")
            .select(["move.id", "move.moveName"])
            .innerJoinAndSelect("move.type", "moveType")
            .take(pageSize)
            .skip(pageSize * pageIndex)
            .getMany();

        const list = data.map(move => ({
            ...move,
            typeName: move.type.typeName
        }));

        response.json({
            list,
            total
        });
    } catch (error) {
        console.log(error);
    }

}

export async function getMoveDetail(request: Request, response: Response) {
    try {
        const moveRepo = getRepository(Move);
        const currentMove = request.params.name;

        const moveData = await moveRepo
            .createQueryBuilder("move")
            .leftJoinAndSelect("move.type", "typeName")
            .leftJoinAndSelect("move.generation", "generation")
            .where(`move.moveName = :value`, {value: currentMove})
            .getOne();

        const data = {
            ...moveData,
            typeName: moveData.type.typeName,
            generation: moveData.generation.gen,
        };

        response.json(data);
    } catch (error) {
        console.log(error);
    }

}