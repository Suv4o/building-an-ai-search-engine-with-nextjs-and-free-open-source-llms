import DatabaseSync from "better-sqlite3";
import path from "path";

function getPlatformSpecificExtension() {
    const platform = process.platform;
    const arch = process.arch;

    if (platform === "darwin" && arch === "arm64") {
        return {
            packageName: "sqlite-vec-darwin-arm64",
            extension: "vec0.dylib",
        };
    }

    // For Intel Macs
    if (platform === "darwin") {
        return {
            packageName: "sqlite-vec-darwin-x64",
            extension: "vec0.dylib",
        };
    }

    if (platform === "linux" && arch === "arm64") {
        return {
            packageName: "sqlite-vec-linux-arm64",
            extension: "vec0.so",
        };
    }

    // For Intel Linux
    if (platform === "linux") {
        return {
            packageName: "sqlite-vec-linux-x64",
            extension: "vec0.so",
        };
    }

    return {
        packageName: "sqlite-vec-windows-x64",
        extension: "vec0.dll",
    };
}

const dbFilePath = path.join(process.cwd(), "blog_articles.sqlite3");
const db = new DatabaseSync(dbFilePath, { allowExtension: true });

const platformExtension = getPlatformSpecificExtension();

const packagePath = path.resolve(`./node_modules/${platformExtension.packageName}`);
const extensionFile = path.join(packagePath, platformExtension.extension);
db.loadExtension(extensionFile);

export default db;
