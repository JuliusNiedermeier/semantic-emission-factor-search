import { PineconeClient } from "@pinecone-database/pinecone";
import { Configuration, OpenAIApi } from "openai";
import { APIEvent, json } from "solid-start";

const pinecone = new PineconeClient();

await pinecone.init({
  environment: process.env.PINECONE_ENVIRONMENT!,
  apiKey: process.env.PINECONE_API_KEY!,
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY!,
});

const openai = new OpenAIApi(configuration);

export const POST = async (event: APIEvent) => {
  const objects = (await event.request.json()) as Record<string, any>[];

  const index = pinecone.Index("emission-factors");
  await index.delete1({ deleteAll: true });

  let id = 0;

  while (objects.length > 0) {
    const objectsChunk = objects.splice(0, 100);

    const embeddingsResponse = await Promise.all(
      objectsChunk.map((object) => {
        // Transform to human readable string
        const objectToEmbed = Object.keys(object)
          .map((key) => `${key}: ${object[key]}`)
          .join("\n");

        // Make request to embeddings endpoint
        return new Promise((resolve) => {
          const _id = id.toString();
          openai
            .createEmbedding({
              model: "text-embedding-ada-002",
              input: objectToEmbed,
            })
            .then((res) =>
              resolve({
                id: _id,
                values: res.data.data[0].embedding,
                metadata: object,
              })
            );

          // console.log("ID:", id);
          // Increment id
          id++;
        });
      })
    );

    console.log("Remaining objects:", objects.length);
    console.log("Created embeddings:", embeddingsResponse.length);
    console.log(
      "Last of chunk embedding:",
      embeddingsResponse[embeddingsResponse.length - 1]
    );

    await index.upsert({
      upsertRequest: {
        vectors: embeddingsResponse as any,
      },
    });
  }

  return json({});
};

/*

Scope: Scope 1
Category 1: Fuels
Category 2: Gaseous fuels
Category 3: Butane
Category 4:
Description:
Unit of measurement: tonnes
GHG/Unit: kg CO2e
Value: 3033.32000

Transformed by OpenAI to 1536 dimensional vector

[0.4238525, 0.7125342, 0.5736325, 0.43624, 0.47382634, 0.474583874, ...1536]

*/
