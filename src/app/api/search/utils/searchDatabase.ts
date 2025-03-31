import { pipeline } from "@huggingface/transformers";
import { BlogArticle } from "../types";
import db from "./db";

export default async function searchDatabase(query: string, limit = 3): Promise<BlogArticle[]> {
    try {
        const embeddingsGenerator = await pipeline("feature-extraction", "./local_models/all-MiniLM-L6-v2/");
        const embeddingsOutput = await embeddingsGenerator(query, { pooling: "mean", normalize: true });
        const vector = embeddingsOutput.tolist();

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
