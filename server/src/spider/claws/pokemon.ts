import { getRepository, Repository } from "typeorm";

import { Pokemon, PokemonMega, PokemonFamily, Generation } from "../../entity/pokedex";
import getPokeStats from "./poke-stats";
import getTypes from "./poke-types";
import insertToPokemonMoves from "./poke-moves";

import { getUrl, hunting, crawlPicToLocal, joiningTogetherText, ok } from "../helper";

type pokeType = {
    generationId?: number,
    ndex: string,
    pokeName: string
};

const pokemons: pokeType[] = [];
export default async function insertToPokemon() {
    try {
        const { $ } = await hunting(getUrl("宝可梦列表（按全国图鉴编号）/简单版"));
        const pokeWrap = $(".roundy tr:nth-child(n+4)");
        let generationId = 1;

        $(pokeWrap).each(function() {
            if (/第(.*?)世代/g.test($(this).find("a:first-child").text())) {
                generationId++;
                return;
            }
            const ndex = $(this).find("td:nth-child(1)").text().trim();
            const pokeName = $(this).find("td:nth-child(2) a").text().trim();
            pokemons.push({pokeName, ndex, generationId});
        });

        for (const [index, pokemon] of pokemons.entries()) {
            await perfectTablePokemon(pokemon);
        }
    } catch (error) {
        throw error.message;
    }
}

async function perfectTablePokemon({pokeName, ndex, generationId}: pokeType) {
    try {
        ok(`正在爬取${pokeName}的数据`);
        const pokeRepository = getRepository(Pokemon);
        const pokemonData = await pokeRepository.findOne({pokeName});
        if (!pokemonData) {

            const { $ } = await hunting(getUrl(pokeName));

            const { avatar, hasMega, megas } = await handleAvatar($, pokeName, ndex);
            // 所属世代
            const generation = await getRepository(Generation).findOne({id: generationId});
            // 外貌
            const appearance = $(".mw-parser-output").find("#外貌").parent().next().text().trim();

            // 进化级别
            let evolutionWrap = $("#进化,#進化,#形态变化").parent().nextAll("table").eq(0);
            evolutionWrap = evolutionWrap.hasClass("a-c") ? evolutionWrap : evolutionWrap.find("table.a-c").eq(0);
            evolutionWrap = evolutionWrap.children().children().children("td:nth-child(odd)").children("table");

            const evolutionNamesWrap = evolutionWrap.find(".textblack > a");

            let familyMembers = joiningTogetherText($, evolutionNamesWrap).split("&");

            // 移除形态变化
            familyMembers = familyMembers.filter((item, index, arr) => arr.indexOf(item) === index);
            let evolutionLv = familyMembers.indexOf(pokeName);
            let typeName = "";

            console.log(evolutionWrap.length, "length");
            const pikachuFamily = ["皮丘", "皮卡丘", "雷丘"];
            // 伊布和皮卡丘家族有独立的html结构,解析太麻烦所以直接写死了;
            if (pokeName.includes("伊布")) {
                if (pokeName === "伊布") {
                    evolutionLv = 0;
                    typeName = "一般";
                } else {
                    evolutionLv = 1;
                }
            } else if (pikachuFamily.indexOf(pokeName) > -1) {
                familyMembers = pikachuFamily;
                evolutionLv = pikachuFamily.indexOf(pokeName);
                typeName = "电";
            } else {
                familyMembers = familyMembers.slice(0, 3).filter(member => member !== "");

                // 没有进化或未进化(有些宝可梦页面没有这一段html)
                if (evolutionLv === -1) {
                    evolutionLv = 0;
                    familyMembers = [pokeName];
                }
            }

            // 关联其它形态
            const famliyRepository = getRepository(PokemonFamily);
            let family = await famliyRepository.createQueryBuilder("family")
                        .where("family.familyMembers like :members", {members: "%" + familyMembers[0] + "%"})
                        .getOne();

            if (!family) {
                family = new PokemonFamily();
                family.familyMembers = familyMembers;
                await famliyRepository.save(family);
            }

            const stats = await getPokeStats($);

            const types = await getTypes($, evolutionWrap.eq(evolutionLv), typeName);
            console.log(types, evolutionLv, familyMembers, pokeName);
            const pokemon = new Pokemon();
            pokemon.pokeName = pokeName;
            pokemon.ndex = ndex;
            pokemon.avatar = avatar;
            pokemon.appearance = appearance;
            pokemon.evolutionLv = evolutionLv;
            pokemon.hasMega = hasMega;
            pokemon.generation = generation;
            pokemon.family = family;
            pokemon.megas = megas;
            pokemon.mainType = types[0] ? types[0].typeName : "无";
            pokemon.types = types;
            pokemon.stats = stats;

            await pokeRepository.save(pokemon);

            await insertToPokemonMoves($, pokemon);
        }

        ok(`-- ${pokeName}已经存入表中 --`);
    } catch (error) {
        console.log(error);
        throw error.message;
    }
}

async function handleAvatar($: CheerioStatic, pokeName: string, ndex: string): Promise<{
    avatar: string,
    megas: PokemonMega[],
    hasMega: boolean,
}> {
    try {
        // 爬取图片包括mega形态(如果有的话)
        const hasMega = $("#超级进化,#超級進化").length > 0;
        const megas: PokemonMega[] = [];

        let avatar = "";
        let pokeImageUrl = "";
        let pokeCardWrap = $("#mw-content-text > .mw-parser-output").children("table").eq(1).children("tbody");

        if (hasMega) {
            const megaWrap = $("#mw-content-text > .mw-parser-output").children("table").eq(2).find("tr[class!=hide]").slice(1);
            for (let i = 0; i < megaWrap.length; i++) {
                const currentName = $(megaWrap).eq(i).text().trim();
                pokeImageUrl = pokeCardWrap.children("tr").eq(i).find("table tr:nth-child(2) a > img").attr("data-url");

                avatar = await crawlPicToLocal(pokeImageUrl);

                if (currentName !== pokeName) {
                    const pokemonMega = new PokemonMega();
                    pokemonMega.megaName = currentName;
                    pokemonMega.megaAvatar = avatar;

                    const PokemonMegaRepository = getRepository(PokemonMega);
                    const megaData = await PokemonMegaRepository.createQueryBuilder("mega")
                        .where("mega.megaName = :name", {name: currentName})
                        .getOne();

                    if (!megaData) {
                        await PokemonMegaRepository.save(pokemonMega);
                    }
                    megas.push(pokemonMega);
                }
            }
        } else {
            if (pokeCardWrap.parent().hasClass("prenxt-nav")) {
                pokeCardWrap = pokeCardWrap.parent().next().children("tbody");
            }

            if (pokeCardWrap.parent().next().is("table")) {
                // 可能存在阿罗拉形态,暂时忽略掉;
                pokeImageUrl = pokeCardWrap.children("tr").eq(0).find("table tr:nth-child(2) a > img").attr("data-url");
            } else {
                pokeImageUrl = pokeCardWrap.children("tr").eq(1).find("a>img").attr("data-url");
            }

            avatar = await crawlPicToLocal(pokeImageUrl, ndex);
        }

        return { avatar, hasMega, megas };
    } catch (error) {
        throw error.message;
    }
}