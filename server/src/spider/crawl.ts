import { createConnection } from "typeorm";

import { fail, warn, ok } from "./helper";
import insertToGeneration from "./claws/generation";
import insertToType from "./claws/type";
import insertToMove from "./claws/move";
import insertToPokemon from "./claws/pokemon";

createConnection().then(async connection => {
    try {
        warn("正在将数据插入到generation表中");
        await insertToGeneration();
        ok("--- generation done ---", "wrap");

        warn("正在将数据插入到type表中");
        await insertToType();
        ok("--- type done ---", "wrap");

        warn("正在将数据插入到move表中");
        await insertToMove();
        ok("--- move done ---", "wrap");

        warn("正在将数据插入到pokemon表中");
        await insertToPokemon();
        ok("--- pokemon done ---", "wrap");

        ok("--- all done ---");
        connection.close();
    } catch (error) {
        fail(error);
    }
}).catch(error => console.log(error));