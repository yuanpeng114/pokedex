import { getRepository } from "typeorm";
import { Move, Pokemon, PokemonMove } from "../../entity/pokedex";
import { ok } from "../helper";

type moveListType = {
    moveName: string,
    learnBy: string
};

export default async function insertToPokemonMoves($: CheerioStatic, pokemon: Pokemon) {
    try {
        // 爬取的是日月版本的
        const startingPosition = $("#可学会的招式_2").length ? $("#可学会的招式_2") :  $("#可学会的招式");
        const moveWrap = $(startingPosition).parent().nextUntil( $("#进化").parent());

        let moveList: moveListType[] = [];

        moveWrap.each(function() {
            const isMoveTable = $(this).is("table");
            if (isMoveTable) {
                const learnBy = $(this).prev().text().trim();
                let $_moves = $(this).find(".at-c");
                if ( learnBy === "只在集换式卡片游戏中") {
                    $_moves = $(this).find("tr:nth-child(n+1)").slice(1);
                }

                $_moves.each(function() {
                    let moveIndex = 2;
                    if ("蛋招式&进化前招式&特殊招式&活动赠送".includes(learnBy)) {
                        moveIndex = 1;
                    }
                    if ("教授招式&只在集换式卡片游戏中".includes(learnBy)) {
                        moveIndex = 0;
                    }
                    const moveName = $(this).find(`td`).eq(moveIndex).find("a").eq(0).text().trim();
                    moveList.push({moveName, learnBy});
                });
            }
        });

        moveList = moveList.filter((move, index, self) => {
            return index === self.findIndex( item => item.moveName === move.moveName);
        });

        const moves: PokemonMove[] = [];
        const moveRepository = getRepository(Move);
        for (const {moveName, learnBy} of moveList) {
            const move = await moveRepository.findOne({moveName});
            if (move) {
                moves.push({learnBy, pokemon, move});
            }
        }
        await getRepository(PokemonMove).save(moves);

    } catch (error) {
        throw error.message;
    }
}