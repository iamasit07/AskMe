import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import dotenv from 'dotenv';

dotenv.config();

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

const indexName = process.env.PINECONE_INDEX_NAME || 'askme-workspaces';

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

export const getVectorStore = async (workspaceId?: string) => {
  const pineconeIndex = getPineconeClient().Index({name: indexName});
  const filter = workspaceId ? { workspaceId } : undefined;

  return await PineconeStore.fromExistingIndex(getEmbeddings(), {
    pineconeIndex,
    filter: filter as Record<string, any>,
  });
};

export const addDocumentToWorkspace = async (workspaceId: string, text: string, title?: string) => {
  const pineconeIndex = getPineconeClient().Index({name: indexName});
  
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.createDocuments(
    [text], 
    [{ workspaceId, title: title || 'Untitled Document' }]
  );
  
  await PineconeStore.fromDocuments(docs, getEmbeddings(), {
    pineconeIndex,
  });
};
