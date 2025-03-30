import DatabaseSync from "better-sqlite3";
import path from "path";

const dbFilePath = path.join(process.cwd(), "blog_articles.sqlite3");
const db = new DatabaseSync(dbFilePath, { allowExtension: true });

export default db;
