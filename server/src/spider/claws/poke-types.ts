import { getRepository } from "typeorm";
import { Type } from "../../entity/pokedex";

export default async function getTypes($: CheerioStatic, typesWrap: any, typeName: string): Promise<Type[]> {
    try {
        let statsWrap = $("#种族值").parent().next();
        if (!statsWrap.is("table")) {
            statsWrap = statsWrap.find("table").eq(0);
        }

        const types: Type[] = [];
        const typeNameList: string[] = [];

        if (typeName) {
            typeNameList.push(typeName);
        } else {
            typesWrap = typesWrap.find("tr").last().find(".type-box-6 a");
            console.log(typesWrap.find(".textblack > a").text());
            $(typesWrap).each(function() {
                typeNameList.push($(this).text().trim());
            });
        }

        for (const typeName of typeNameList) {
            const type = await getRepository(Type).findOne({typeName});
            if (type) {
                types.push(type);
            }
        }

        return types;
    } catch (error) {
        throw error.message;
    }
}