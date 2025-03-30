This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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
