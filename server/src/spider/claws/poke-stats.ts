import { getRepository } from "typeorm";

import { PokemonStat } from "../../entity/pokedex";

export default async function getPokeStat($: CheerioStatic): Promise<PokemonStat> {
    try {
        let statsWrap = $("#种族值").parent().next();
        if (!statsWrap.is("table")) {
            statsWrap = statsWrap.find("table").eq(0);
        }

        // hp,attack,defense,special_attack,special_defense,speed
        const pokemonStats = new PokemonStat();
        pokemonStats.hp =  $(statsWrap).find(".bgl-HP").filter("[width=30]").text().trim();
        pokemonStats.attack =  $(statsWrap).find(".bgl-攻击").filter("[width=30]").text().trim();
        pokemonStats.defense =  $(statsWrap).find(".bgl-防御").filter("[width=30]").text().trim();
        pokemonStats.specialAttack =  $(statsWrap).find(".bgl-特攻").filter("[width=30]").text().trim();
        pokemonStats.specialDefense =  $(statsWrap).find(".bgl-特防").filter("[width=30]").text().trim();
        pokemonStats.speed =  $(statsWrap).find(".bgl-速度").filter("[width=30]").text().trim();
        await getRepository(PokemonStat).save(pokemonStats);
        return pokemonStats;
    } catch (error) {
        throw error;
    }
}