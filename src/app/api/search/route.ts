import { NextRequest, NextResponse } from "next/server";
import searchDatabase from "./utils/searchDatabase";
import { pipeline, TextStreamer } from "@huggingface/transformers";

export async function GET(request: NextRequest): Promise<Response> {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query");

    if (!query) {
        return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    try {
        const results = await searchDatabase(query, 5);

        const textGenerator = await pipeline("text-generation", "./local_models/Phi-3-mini-4k-instruct/", {
            local_files_only: true,
        });

        // Generate AI response based on search results
        const systemMessage = `You are an AI assistant helping users by generating accurate and well-structured responses based on retrieved knowledge. 
Below are the top five most relevant content pieces retrieved from an AI-powered search engine using semantic embeddings. 
Use them as context to generate a clear, concise, and helpful response to the user's query.

Here are the top five most relevant content pieces retrieved from the AI-powered search engine:

${results
    .map((article, index: number) => {
        return `${index + 1}. ${article.content}
        
        Source: ${"https://www.trpkovsi.com" + article.articlePath}`;
    })
    .join("\n")}

Based on this, I will generate a response.

Instructions:
- Summarise and synthesise the retrieved content to generate a helpful answer.
- Maintain a technical and informative tone.
- If the retrieved content lacks sufficient details, provide a general best-practice response while indicating possible gaps.
- Avoid making up facts beyond the retrieved content.
- Use Australian English spelling and grammar.
- Ensure the response is in Markdown format.
- Cite sources inline where applicable** using Markdown links.
- Do not add a separate "Sources" section; instead, reference them within the relevant parts of the response.`;

        const messages = [
            {
                role: "system",
                content: systemMessage,
            },
            { role: "user", content: `User query: "${query}"` },
        ];

        // Set up streaming response
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Create streamer with callback function to stream chunks as they're generated
        const streamer = new TextStreamer(textGenerator.tokenizer, {
            skip_prompt: true,
            callback_function: async (text) => {
                // Send the text chunk to the client
                await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            },
        });

        // Start the generation process without awaiting its completion
        textGenerator(messages, {
            max_new_tokens: 4096,
            temperature: 0.2,
            streamer,
        })
            .then(async () => {
                // When generation is complete, close the stream
                await writer.write(encoder.encode("data: [DONE]\n\n"));
                await writer.close();
            })
            .catch(async (error) => {
                // Handle errors during generation
                console.error("Generation error:", error);
                await writer.write(encoder.encode(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`));
                await writer.close();
            });

        // Return a streaming response
        return new Response(stream.readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
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
