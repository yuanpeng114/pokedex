import { getRepository, Repository  } from "typeorm";
import { Move, Type, Generation } from "../../entity/pokedex";

import { getUrl, hunting, joiningTogetherText, ok, warn } from "../helper";

type moveType = {
    moveUrl: string,
    generationId: number,
    moveName: string,
    power: string,
    hit: string
};

let moves: moveType[] = [];
export default async function insertToMove() {
    try {
        const { $ } = await hunting(getUrl("招式列表"));

        const movesWrap = $(".mw-parser-output .eplist");

        $(movesWrap).each(function(index) {
            const generationId = index + 1;
            $(this).find("tr").each(function() {
                if ($(this).find("td").length !== 9) return;

                const moveName: string = $(this).find("td:nth-child(2) a:last-child").text().trim();
                const moveUrl: string = $(this).find("td:nth-child(2) a:last-child").attr("href");
                const power: string =  $(this).find("td:nth-child(7)").text().trim();
                const hit: string =  $(this).find("td:nth-child(8)").text().trim();
                moves.push({generationId, moveName, moveUrl, power, hit});
            });
        });

        const moveRepository = getRepository(Move);
        const [data, moveLength] = await moveRepository.findAndCount();

        moves = moves.filter((move, index, self) => {
            return index === self.findIndex( item => item.moveName === move.moveName);
        });

        if (moveLength === moves.length) {
            return;
        }
        for (const [index, move] of moves.entries()) {
            await handleInsertToMove(move, moveRepository);
        }
    } catch (error) {
        throw error.message;
    }
}

async function handleInsertToMove({generationId, moveUrl, moveName, hit, power}: moveType, moveRepository: Repository<Move>): Promise<void> {
    try {
        warn(`正在爬取招式${moveName}的数据`);
        const moveData = await moveRepository.findOne({moveName});
        if (!moveData) {
            const { $ } = await hunting(getUrl(`${decodeURIComponent(moveUrl)}`));
            // 以下是table-招式的各列

            const battleWrap = $(".mw-parser-output .roundy.a-r").find("tr").eq(3).find("tbody");

            // 属性
            const typeName = $(battleWrap).children("tr:first-child").find(".roundyright a").text().trim();
            const type = await getRepository(Type).findOne({typeName});

            // 所属世代
            const generation = await getRepository(Generation).findOne({id: generationId});

            // 招式说明
            const description = $(".mw-parser-output .roundy.a-r").find("tr").eq(1).text().trim();

            // 招式类别(物理，特殊，变化, Z)
            const category = $(battleWrap).children("tr:nth-child(2)").find(".roundyright a").text();

            // pp,最大pp
            const ppText = $(battleWrap).children("tr:nth-child(3)").find(".roundytr").text();
            let pp = "-", maxPP = "-";
            const ppTextMatch = ppText.match(/\d+/g);
            if (ppTextMatch) {
                pp = ppTextMatch[0] || "-";
                maxPP = ppTextMatch[1] || "-";
            }

            // 对战说明
            const battleDescriptionEle = $(battleWrap).children("tr:last-child").find("li");
            const battleDescription = joiningTogetherText($, battleDescriptionEle);

            const move = new Move();
            move.moveName = moveName;
            move.battleDescription = battleDescription;
            move.description = description;
            move.power = power;
            move.hit = hit;
            move.pp = pp;
            move.maxPP = maxPP;
            move.category = category;
            move.type = type;
            move.generation = generation;

            getRepository(Move).save(move);
        }

        ok(`-- ${moveName}已经存入表中 --`);
    } catch (error) {
        throw error.message;
    }
}