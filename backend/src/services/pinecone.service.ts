import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

let pineconeClient: PineconeClient | null = null;
const getPineconeClient = () => {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY must be set in the environment");
    }
    pineconeClient = new PineconeClient({ apiKey });
  }
  return pineconeClient;
};

const indexName: string= process.env.PINECONE_INDEX_NAME || 'askme-workspaces';

const EMBEDDING_DIMENSION: number = Number(process.env.EMBEDDING_DIMENSION) || 768;

let embeddings: GoogleGenerativeAIEmbeddings | null = null;
const getEmbeddings = () => {
  if (!embeddings) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY must be set in the environment");
    }
    embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: 'text-embedding-004',
      apiKey: apiKey,
    });
  }
  return embeddings;
};

let indexReady = false;
const ensureIndexExists = async () => {
  if (indexReady) return;

  const client = getPineconeClient();

  try {
    const { indexes } = await client.listIndexes();
    const exists = indexes?.some((idx) => idx.name === indexName);

    if (!exists) {
      console.log(`[Pinecone] Index "${indexName}" not found. Creating serverless index...`);
      await client.createIndex({
        name: indexName,
        dimension: EMBEDDING_DIMENSION,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
        waitUntilReady: true,
      });
      console.log(`[Pinecone] Index "${indexName}" created successfully.`);
    } else {
      console.log(`[Pinecone] Index "${indexName}" already exists.`);
    }

    indexReady = true;
  } catch (error) {
    console.error(`[Pinecone] Failed to ensure index exists:`, error);
    throw error;
  }
};

export const getVectorStore = async () => {
  await ensureIndexExists();
  const pineconeIndex = getPineconeClient().index({name: indexName});

  return await PineconeStore.fromExistingIndex(getEmbeddings(), {
    pineconeIndex: pineconeIndex as any,
  });
};

export const addDocumentToWorkspace = async (workspaceId: string, text: string, title?: string) => {
  await ensureIndexExists();
  const pineconeIndex = getPineconeClient().index({name: indexName});
  
  if (!text || text.trim().length === 0) {
    console.warn(`[Pinecone] Skipping ingest for workspace ${workspaceId}: provided text is empty.`);
    return;
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.createDocuments(
    [text], 
    [{ workspaceId, title: title || 'Untitled Document' }]
  );

  if (docs.length === 0) {
    console.warn(`[Pinecone] Skipping ingest for workspace ${workspaceId}: text splitter produced 0 documents.`);
    return;
  }
  
  try {
    await PineconeStore.fromDocuments(docs, getEmbeddings(), {
      pineconeIndex: pineconeIndex as any,
    });
  } catch (error) {
    console.error(`[Pinecone] Failed to ingest into vector store:`, error);
  }
};
