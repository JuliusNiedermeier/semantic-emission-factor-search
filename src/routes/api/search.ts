import { APIEvent, json } from "solid-start";
import { Configuration, OpenAIApi } from "openai";
import { PineconeClient, QueryRequest } from "@pinecone-database/pinecone";
import "dotenv/config";

export type SearchResponse = {
  score: number;
  metadata: Record<string, any>;
}[];

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY!,
});

const openai = new OpenAIApi(configuration);

const pinecone = new PineconeClient();

await pinecone.init({
  environment: process.env.PINECONE_ENVIRONMENT!,
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index("emission-factors");

export const GET = async ({ request }: APIEvent) => {
  const query = new URL(request.url).searchParams.get("q");

  if (!query) return json([]);

  const response = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: query,
  });

  const results = await index.query({
    queryRequest: {
      vector: response.data.data[0].embedding,
      topK: 5,
      includeMetadata: true,
      includeValues: false,
    },
  });

  return json(
    results.matches?.map((match): SearchResponse[number] => ({
      score: match.score!,
      metadata: match.metadata!,
    }))
  );
};
