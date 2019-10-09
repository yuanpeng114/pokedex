export const removeUselessKeys = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => newObj[key] === undefined && delete newObj[key]);
    return newObj;
};

export const pick = (obj: any, keys: string[]) => {
    const newObj: {[key: string]: any} = {};
    for (const key of keys) {
        const value = obj[key];
        if (obj.hasOwnProperty(key) && value) {
            newObj[key] = value;
        }
    }
    return newObj;
};