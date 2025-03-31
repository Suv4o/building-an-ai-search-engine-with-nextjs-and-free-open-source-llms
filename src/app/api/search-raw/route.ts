import { NextRequest, NextResponse } from "next/server";
import searchDatabase from "../search/utils/searchDatabase";

export async function GET(request: NextRequest): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
        return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    try {
        const results = await searchDatabase(query);
        return NextResponse.json({ results });
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
