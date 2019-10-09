import fs from "fs";
import path from "path";
import http from "http";
import https from "https";
import axios, { AxiosResponse } from "axios";
import chalk from "chalk";
import cheerio from "cheerio";

type chalkFunc = (message: any, isWrap?: string) => void;
type huntingFunc = (url: string, options?: object) => Promise<{response: AxiosResponse, $: CheerioStatic}>;

export const ok: chalkFunc = (message, isWrap) => console.log(chalk.greenBright(JSON.stringify(message)), isWrap === "wrap" ? "\n" : "");
export const warn: chalkFunc = (message, isWrap) => console.log(chalk.yellowBright(JSON.stringify(message)), isWrap === "wrap" ? "\n" : "");
export const fail: chalkFunc = (message, isWrap) => console.log(chalk.redBright(JSON.stringify(message)), isWrap === "wrap" ? "\n" : "");

export const hunting: huntingFunc = async (url, options) => {
    try {
        options = {
            url,
            method: "get",
            timeout: 3000,
            httpAgent: new http.Agent({ keepAlive: true }),
            httpsAgent: new https.Agent({ keepAlive: true }),
            headers: {
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                "accept-encoding": "gzip, deflate, br",
            },
            ...options
        };

        const response: AxiosResponse = await axios(options);
        const $: CheerioStatic = cheerio.load(response.data, {decodeEntities: false} );

        return {response, $};
    } catch (error) {
        if (error.message === "timeout of 3000ms exceeded" || error.message === "socket hang up") {
            warn("超出预定时间,正在重新请求");
            return hunting(url, options);
        }
        throw error;
    }
};

export const getUrl = (pathname: string): string => {
    pathname = pathname.replace(/(.*)wiki(\/)?/, "");
    return `http://wiki.52poke.com/wiki/${encodeURIComponent(pathname)}`;
};

export const crawlPicToLocal = async (pictureUrl: string, ndex?: string): Promise<string> => {
    try {
        let picName = "";
        let pokemonPicURL = "";
        if (!pictureUrl) {
            picName = ndex.slice(1);
            console.log(picName);
            pokemonPicURL = `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${picName}.png`;
        } else {
            pokemonPicURL = `https:${pictureUrl.replace(/(\/thumb)|(\/\d*px.*)/g, "")}`;
            picName = pictureUrl.match(/-?(?<=\d{3,}).+?(?=\.png)/)[0].toLowerCase();
        }

        pictureUrl = path.join("/public/images/pokedex", `${picName}.png`);
        const { response } = await hunting(pokemonPicURL, {responseType: "stream"});
        if (!fs.existsSync(pictureUrl)) {
            const picAbsRoot = path.join(path.dirname(__dirname), pictureUrl);
            const imageWriteStream = fs.createWriteStream(picAbsRoot);
            response.data.pipe(imageWriteStream);
        }

        return pictureUrl;
    } catch (error) {
        throw error;
    }
};

export const joiningTogetherText = ($: CheerioStatic, ele: any): string => {
    let fullText = "";
    $(ele).each(function(index) {
        const text = $(this).text().trim();
        fullText += index === $(ele).length - 1
            ? `${text}` : `${text}&`;
    });

    return fullText;
};