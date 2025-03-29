import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    // Get the URL from the request
    const { searchParams } = new URL(request.url);

    // Extract the query parameter
    const query = searchParams.get("query");

    // If no query parameter was provided
    if (!query) {
        return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    // Return the query parameter to the user
    return NextResponse.json({ query }, { status: 200 });
}
