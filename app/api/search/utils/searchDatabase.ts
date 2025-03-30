import { pipeline } from "@huggingface/transformers";
import * as sqliteVec from "sqlite-vec";
import path from "path";
import fs from "fs";
import { BlogArticle } from "../types";
import db from "./db";

// Helper function to determine the correct extension package and file
function getPlatformSpecificExtension() {
    const platform = process.platform;
    const arch = process.arch;

    if (platform === "darwin") {
        if (arch === "arm64") {
            return {
                packageName: "sqlite-vec-darwin-arm64",
                extension: "vec0.dylib",
            };
        } else {
            // For Intel Macs
            return {
                packageName: "sqlite-vec-darwin-x64",
                extension: "vec0.dylib",
            };
        }
    } else if (platform === "linux") {
        return {
            packageName: "sqlite-vec-linux-x64",
            extension: "vec0.so",
        };
    } else if (platform === "win32") {
        return {
            packageName: "sqlite-vec-windows-x64",
            extension: "vec0.dll",
        };
    }

    // Default fallback
    return null;
}

export default async function searchDatabase(query: string, limit = 3): Promise<BlogArticle[]> {
    try {
        const embeddingsGenerator = await pipeline("feature-extraction", "./local_models/all-MiniLM-L6-v2/");
        const embeddingsOutput = await embeddingsGenerator(query, { pooling: "mean", normalize: true });
        const vector = embeddingsOutput.tolist();

        try {
            // Try platform-specific loading first
            const platformExtension = getPlatformSpecificExtension();

            if (platformExtension) {
                const packagePath = path.resolve(`./node_modules/${platformExtension.packageName}`);

                if (fs.existsSync(packagePath)) {
                    const extensionFile = path.join(packagePath, platformExtension.extension);

                    if (fs.existsSync(extensionFile)) {
                        db.loadExtension(extensionFile);
                    } else {
                        console.warn(`Extension file not found at ${extensionFile}, falling back to generic loader`);
                        sqliteVec.load(db);
                    }
                } else {
                    console.warn(
                        `Package path not found for ${platformExtension.packageName}, falling back to generic loader`
                    );
                    sqliteVec.load(db);
                }
            } else {
                // Use the generic loader if platform detection failed
                sqliteVec.load(db);
            }
        } catch (loadError) {
            console.error("Error loading sqlite-vec extension:", loadError);

            throw new Error(
                `Failed to load SQLite vector search extension. Error: ${
                    loadError instanceof Error ? loadError.message : "Unknown error"
                }. ` + `Platform: ${process.platform}, Architecture: ${process.arch}.`
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
