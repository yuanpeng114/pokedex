import path from "path";
import fs from "fs";

function copy(source: string, target: string) {
    const direntList = fs.readdirSync(source, {withFileTypes: true});

    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    direntList.forEach(dirent => {
        const name = dirent.name;
        const sourcePath = path.join(source, name);
        const targetPath = path.join(target, name);

        if (dirent.isDirectory()) {
            copy(sourcePath, targetPath);
            return;
        }

        fs.copyFileSync(sourcePath, targetPath);
    });
}

copy("src/public", "dist/public");