import "better-sqlite3";

declare module "better-sqlite3" {
    interface Options {
        allowExtension?: boolean;
    }
}
