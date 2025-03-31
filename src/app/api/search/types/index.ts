export interface BlogArticle {
    id?: number;
    articlePath: string;
    embeddings: number[];
    content: string;
    distance?: number;
}
