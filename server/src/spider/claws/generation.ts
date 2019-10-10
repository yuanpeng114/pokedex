import { getRepository } from "typeorm";

import { Generation } from "../../entity/pokedex";
import { getUrl, hunting, ok, fail } from "../helper";

export default async function insertToGeneration() {
    try {

        const { $ } = await hunting(getUrl("世代"));
        const generations: Array<{gen: string}> = [];

        $(".mw-parser-output a").each(function() {
            const gen = $(this).text();
            if (/^第/.test(gen)) {
                generations.push({gen});
            }
        });

        const generationRepository = getRepository(Generation);
        const [data, genLengh] = await generationRepository.findAndCount();

        if (genLengh === generations.length) {
          return;
        }

        await generationRepository.save(generations);
    } catch (error) {
        throw error.message;
    }
}