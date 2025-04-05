# Building an AI Search Engine with Next.js and Free Open-Source LLMs

Build your own AI search engine with Next.js, SQLite, and free open-source LLMs. This tutorial guides you through implementing Retrieval-Augmented Generation (RAG) for accurate, context-aware search, bypassing costly APIs. Discover how to leverage local models and vector databases for powerful, privacy-focused search results.

This example is part of my blog post [Building an AI Search Engine with Next.js and Free Open-Source LLMs](https://www.trpkovski.com/2025/04/05/building-an-ai-search-engine-with-nextjs-and-free-open-source-llms). Please refer to the blog article for detailed explanation.

![Hero image](https://res.cloudinary.com/suv4o/image/upload/q_auto,f_auto,w_1200,e_sharpen:100/v1743826108/blog/building-an-ai-search-engine-with-nextjs-and-free-open-source-llms/ChatGPT_Image_Apr_5_2025_01_58_48_PM_famrgp)

## Getting Started

Run the development server:

```bash
npm run dev
```

## Build the project:

```bash
npm run build
```

## Run the project:

```bash
npm run start
```

## Cloning the Repository with Submodules

This repository contains submodules that point to Hugging Face model repositories. The submodules are located in the local_models directory, specifically:

-   `local_models/all-MiniLM-L6-v2`
-   `local_models/Phi-3-mini-4k-instruct`

By default, when you clone a repository with submodules, Git does not automatically download the contents of the submodules. You have two options to get all the corresponding files in the local_models directory:

### Option 1: Clone with the --recurse-submodules flag

```bash
git clone --recurse-submodules https://your-repository-url.git
```

### Option 2: If you've already cloned the repository without the submodules, run:

```bash
git submodule update --init --recursive
```

This second command will initialize your local configuration file, fetch all the data from the submodule repositories, and check out the appropriate commits in your local submodule directories.

The files from the Hugging Face model repositories will then be available in your `local_models/all-MiniLM-L6-v2` and `local_models/Phi-3-mini-4k-instruct` directories.

## Troubleshooting

If you use Linux you will need to install the following dependencies:

```bash
npm install sqlite-vec-linux-x64
```
