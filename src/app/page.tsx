"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github.css";

// Format article path: extract slug, replace hyphens with spaces, and capitalize each word
const formatArticleSlug = (path: string) => {
    // Extract slug (everything after potential date pattern)
    const slug = path.replace(/^\/\d{4}\/\d{2}\/\d{2}\//, "");

    // Replace hyphens with spaces and capitalize each word
    return slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

export default function Home() {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [rawResults, setRawResults] = useState<Array<{ content: string; articlePath: string }>>([]);
    const resultRef = useRef<HTMLDivElement>(null);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setResult("");
        setError("");
        setRawResults([]);

        try {
            // Fetch raw search results immediately
            fetch(`/api/search-raw?query=${encodeURIComponent(query)}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.results) {
                        setRawResults(data.results);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching raw search results:", err);
                });

            const eventSource = new EventSource(`/api/search?query=${encodeURIComponent(query)}`);

            eventSource.onmessage = (event) => {
                if (event.data === "[DONE]") {
                    eventSource.close();
                    setLoading(false);
                    return;
                }

                try {
                    const data = JSON.parse(event.data);
                    if (data.error) {
                        setError(data.error);
                        setLoading(false);
                        eventSource.close();
                    } else {
                        setResult((prev) => prev + (data.text || ""));

                        // Auto-scroll to bottom of results
                        if (resultRef.current) {
                            resultRef.current.scrollTop = resultRef.current.scrollHeight;
                        }
                    }
                } catch (err) {
                    console.error("Error parsing event data:", err);
                }
            };

            eventSource.onerror = () => {
                setError("An error occurred while fetching results. Please try again.");
                setLoading(false);
                eventSource.close();
            };
        } catch (err) {
            console.error("Error connecting to search service:", err);
            setError("Failed to connect to search service.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">AI Search Engine</h1>
                    <p className="mt-3 text-xl text-gray-500">
                        Ask any question and get intelligent answers powered by AI
                    </p>
                </div>

                <div className="mt-10">
                    <div className="flex rounded-lg shadow-lg overflow-hidden">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !loading && query.trim() && handleSearch()}
                            placeholder="What would you like to know?"
                            className="flex-1 min-w-0 block w-full px-5 py-4 text-base border-0 focus:outline-none focus:ring-0"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading || !query.trim()}
                            className={`cursor-pointer px-6 py-4 border-0 text-base font-medium text-white ${
                                loading || !query.trim()
                                    ? "bg-indigo-300 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700 transition-colors duration-150"
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Searching...
                                </div>
                            ) : (
                                "Search"
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}
                </div>

                {(result || loading || rawResults.length > 0) && (
                    <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                {loading ? "Generating response..." : "Search Results"}
                            </h3>
                        </div>

                        {rawResults.length > 0 && (
                            <div className="px-6 py-5 bg-indigo-50 border-b border-indigo-100">
                                <h4 className="text-lg font-semibold text-indigo-800 mb-3">Source Articles:</h4>
                                <ul className="space-y-3">
                                    {rawResults.map((result, index) => (
                                        <li key={index} className="text-base">
                                            <a
                                                href={`https://www.trpkovski.com${result.articlePath}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-start"
                                            >
                                                <span className="inline-block font-medium mr-2">
                                                    Source {index + 1}:
                                                </span>
                                                <span className="flex-1 inline">
                                                    {formatArticleSlug(result.articlePath)}
                                                </span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div ref={resultRef} className="px-6 py-5 max-h-[60vh] overflow-y-auto bg-white">
                            {loading && !result && (
                                <div className="flex items-center justify-center py-10">
                                    <div className="animate-pulse flex space-x-4">
                                        <div className="flex-1 space-y-4 py-1">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-200 rounded"></div>
                                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {result && (
                                <div className="markdown-content text-gray-700 leading-relaxed">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                                        components={{
                                            h1: (props) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                                            h2: (props) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                                            h3: (props) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                                            p: (props) => <p className="mb-4" {...props} />,
                                            ul: (props) => <ul className="list-disc pl-5 mb-4" {...props} />,
                                            ol: (props) => <ol className="list-decimal pl-5 mb-4" {...props} />,
                                            li: (props) => <li className="mb-1" {...props} />,
                                            a: (props) => (
                                                <a
                                                    className="text-blue-600 hover:underline"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    {...props}
                                                />
                                            ),
                                            blockquote: (props) => (
                                                <blockquote
                                                    className="border-l-4 border-gray-200 pl-4 py-2 mb-4 italic"
                                                    {...props}
                                                />
                                            ),
                                            code: ({ className, children, ...props }) => {
                                                const isChildrenArray = Array.isArray(children);
                                                if (!isChildrenArray) {
                                                    return (
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                }

                                                return (
                                                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto mb-4">
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    </pre>
                                                );
                                            },
                                            table: (props) => (
                                                <table
                                                    className="min-w-full divide-y divide-gray-200 mb-4"
                                                    {...props}
                                                />
                                            ),
                                            thead: (props) => <thead className="bg-gray-50" {...props} />,
                                            tbody: (props) => <tbody className="divide-y divide-gray-200" {...props} />,
                                            tr: (props) => <tr className="hover:bg-gray-50" {...props} />,
                                            th: (props) => (
                                                <th
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    {...props}
                                                />
                                            ),
                                            td: (props) => (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm" {...props} />
                                            ),
                                        }}
                                    >
                                        {result}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
