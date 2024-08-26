import { Pinecone } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are an AI Asistant specialized in recommending professors based on student reviews based on their specific queries.

Rules: reply to user with 'welcome!' message and continue with user specific query.
1. Respond to greetings or simple acknowledgments with an appropriate reply (e.g., 'Hello! How can I assist you today?').
2. Only provide professor recommendations when the user inquires about specific professors or asks for help regarding professor ratings.
3. Your role is to understand the user's needs and provide the top three professor recommendations using Retrieval-Augmented Generation (RAG).
Guidelines:
Understand the Query:
Analyze the user's question to determine the subject, teaching style, or specific attributes they are interested in.
Retrieve Information:
Use RAG to search through a comprehensive database of professor reviews and ratings.
Focus on finding professors who match the criteria specified in the user's query.
Provide Recommendations:
Present the top three professors who best fit the user's requirements.
Include relevant information such as the professor's name, subject taught, average rating, and a brief summary of their teaching style or notable strengths.
Be Concise and Informative:
Ensure that the recommendations are clear and provide enough information for the user to make an informed decision.
Avoid overwhelming the user with too much information; focus on the most relevant details.
Maintain a Friendly and Professional Tone:
Communicate in a way that is approachable yet professional, ensuring a positive user experience.`

// Create the POST function
export async function POST(req) {
  try {
    const data = await req.json();
    // Process the user’s query
    const text = data[data.length - 1].content;
    // console.log(`Processing user query: ${text}`);

    // Initialize Pinecone
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pc.index("rag").namespace("ns1");
    const openai = new OpenAI();

    // Get embeddings from OpenAI
    const embeddings = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    const embedding = embeddings.data[0].embedding;
    // console.log("Embedding:", embedding);

    // Query Pinecone
    const results = await index.query({
      topK: 5,
      includeMetadata: true,
      vector: embedding,
    });
    // console.log("Pinecone results:", results);

    // Format the results
    let resultString = "";
    results.matches.forEach((match) => {
      resultString += `
    Returned Results:
    Professor: ${match.id}
    Review: ${match.metadata.review}
    Subject: ${match.metadata.subject}
    Stars: ${match.metadata.stars}
    \n\n`;
    });

    // Prepare the OpenAI request
    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

    // Send request to OpenAI
    let completion;
    try {
      completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          ...lastDataWithoutLastMessage,
          { role: "user", content: lastMessageContent },
        ],
        model: "gpt-4o-mini",
        stream: true,
    });
  } catch (error) {
    console.error("Error creating chat completion:", error);
    return new NextResponse("Error creating chat completion", { status: 500 });
  }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder(); 
        try {
          
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content; 
            if (content) {
              const text = encoder.encode(content); 
              controller.enqueue(text); 
            }
          }
        } catch (err) {
          controller.error(err); 
        } finally {
          controller.close(); 
        }
      },
    });
    return new NextResponse(stream);
  }
  catch (error) {
    console.error("Error processing request:", error);
    return new NextResponse("Error processing request", { status: 500 });
  }
}
