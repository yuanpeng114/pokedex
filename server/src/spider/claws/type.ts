import { getRepository } from "typeorm";
import { Type } from "../../entity/pokedex";

import { getUrl, hunting, ok, fail } from "../helper";

export default async function insertToType() {
    try {
        const { $ } = await hunting(getUrl("属性"));
        const types: Array<{typeName: string}> = [];

        $(".roundy.bd-变化 td.roundy-15").each(function() {
            const typeName: string = $(this).find("a").text();
            if (typeName.includes("?")) return;
            types.push({typeName});
        });

        const typeRepository = getRepository(Type);
        const [data, typeLengh] = await typeRepository.findAndCount();

        if (typeLengh === types.length) {
          return;
        }

        await typeRepository.save(types);
    } catch (error) {
        throw error.message;
    }
}