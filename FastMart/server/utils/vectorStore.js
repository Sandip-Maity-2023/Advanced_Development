// backend/utils/vectorStore.js
import { ChromaClient } from "chromadb";

const chroma = new ChromaClient({ path: "http://localhost:8000" });

export const syncProductToVectorStore = async (product) => {
  try {
    const collection = await chroma.getOrCreateCollection({ name: "products_catalog" });

    // 1. Create a detailed string that captures metadata for vector embeddings
    const productTextContext = `
      Product Name: ${product.name}
      Category: ${product.category}
      Price: ₹${product.price}
      Description: ${product.description}
      Specs: ${JSON.stringify(product.specs || {})}
    `;

    // 2. Upsert it into the collection
    await collection.upsert({
      ids: [product._id.toString()],
      documents: [productTextContext],
      metadatas: [{ 
        name: product.name, 
        price: product.price, 
        id: product._id.toString() 
      }]
    });
    console.log(`Vector sync successful for product: ${product.name}`);
  } catch (error) {
    console.error("Vector sync failed:", error);
  }
};
