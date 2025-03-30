import { pipeline } from "@huggingface/transformers";
import * as sqliteVec from "sqlite-vec";
import path from "path";
import fs from "fs";
import { BlogArticle } from "../types";
import db from "./db";

export default async function searchDatabase(query: string, limit = 3): Promise<BlogArticle[]> {
    try {
        const embeddingsGenerator = await pipeline("feature-extraction", "./local_models/all-MiniLM-L6-v2/");
        const embeddingsOutput = await embeddingsGenerator(query, { pooling: "mean", normalize: true });
        const vector = embeddingsOutput.tolist();

        try {
            // Let's try to directly locate the extension file
            const packagePath = path.resolve("./node_modules/sqlite-vec-darwin-arm64");

            // If the package exists, check for the extension file
            if (fs.existsSync(packagePath) && process.platform === "darwin" && process.arch === "arm64") {
                const extensionFile = path.join(packagePath, "vec0.dylib");

                if (fs.existsSync(extensionFile)) {
                    // Try loading directly
                    db.loadExtension(extensionFile);
                } else {
                    throw new Error(`Extension file not found at ${extensionFile}`);
                }
            } else {
                // Try the normal way as fallback
                sqliteVec.load(db);
            }
        } catch (loadError) {
            console.error("Error loading sqlite-vec extension:", loadError);

            // Better error message with debugging info
            throw new Error(
                `Failed to load SQLite vector search extension. Error: ${
                    loadError instanceof Error ? loadError.message : "Unknown error"
                }. ` +
                    `Platform: ${process.platform}, Architecture: ${process.arch}. ` +
                    `Please run: npm install sqlite-vec-darwin-arm64 --no-save`
            );
        }

        const rows = db
            .prepare(
                `
        SELECT
          rowid,
          distance,
          content,
          articlePath
        FROM blog_articles
        WHERE embedding MATCH ?
        ORDER BY distance
        LIMIT ${limit}
        `
            )
            .all(new Uint8Array(new Float32Array(vector[0] as number[]).buffer));

        return rows as BlogArticle[];
    } catch (error) {
        console.error("Error searching database:", error);
        throw error;
    }
}
