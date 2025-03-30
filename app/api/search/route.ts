import { NextRequest, NextResponse } from "next/server";
import { pipeline } from "@huggingface/transformers";
import DatabaseSync from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import path from "path";
import fs from "fs";

interface Article {
    id?: number;
    articlePath: string;
    embeddings: number[];
    content: string;
    distance?: number;
}

const dbFilePath = path.join(process.cwd(), "blog_articles.sqlite3");

async function searchDatabase(query: string): Promise<Article[]> {
    try {
        const embeddingsGenerator = await pipeline("feature-extraction", "./local_models/all-MiniLM-L6-v2/");
        const embeddingsOutput = await embeddingsGenerator(query, { pooling: "mean", normalize: true });
        const vector = embeddingsOutput.tolist();

        const db = new DatabaseSync(dbFilePath, { allowExtension: true });

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
        LIMIT 3
        `
            )
            .all(new Uint8Array(new Float32Array(vector[0] as number[]).buffer));

        db.close();
        return rows as Article[];
    } catch (error) {
        console.error("Error searching database:", error);
        throw error;
    }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    // Get the URL from the request
    const { searchParams } = new URL(request.url);

    // Extract the query parameter
    const query = searchParams.get("query");

    // If no query parameter was provided
    if (!query) {
        return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    try {
        const results = await searchDatabase(query);

        return NextResponse.json(
            {
                query,
                results,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Search failed:", error);
        return NextResponse.json(
            {
                error: "An error occurred during search",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
