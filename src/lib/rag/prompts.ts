/**
 * Prompt templates for the RAG application
 * Uses LangChain's PromptTemplate for clean prompt management
 */

import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Main RAG prompt template for question answering
 * Provides clear instructions for context-based responses
 */
export const RAG_PROMPT_TEMPLATE = PromptTemplate.fromTemplate(`
You are a helpful AI assistant that answers questions based on the provided context. 
Follow these guidelines:

1. Use ONLY the information from the provided context to answer questions
2. If the context doesn't contain enough information, clearly state this limitation
3. Provide specific, accurate, and helpful answers
4. Cite relevant parts of the context when possible
5. If asked about something not in the context, politely explain you can only answer based on the provided documents

Context:
{context}

Question: {question}

Answer: Let me help you based on the information provided in the documents.
`);

/**
 * Prompt for summarizing retrieved context chunks
 * Helps create coherent context from multiple document fragments
 */
export const CONTEXT_SUMMARY_TEMPLATE = PromptTemplate.fromTemplate(`
Please summarize the following document chunks into a coherent context that maintains all important details:

Document Chunks:
{chunks}

Create a clear, comprehensive summary that preserves key information and maintains logical flow:
`);

/**
 * Prompt for follow-up question generation
 * Helps users explore topics more deeply
 */
export const FOLLOWUP_QUESTIONS_TEMPLATE = PromptTemplate.fromTemplate(`
Based on this conversation about "{topic}", suggest 3 relevant follow-up questions that would help the user learn more:

Previous Question: {question}
Answer Given: {answer}

Generate 3 thoughtful follow-up questions that:
1. Explore related aspects of the topic
2. Dig deeper into the subject matter
3. Help uncover additional insights

Follow-up Questions:
`);

/**
 * Prompt for query expansion and refinement
 * Improves retrieval by generating related search terms
 */
export const QUERY_EXPANSION_TEMPLATE = PromptTemplate.fromTemplate(`
Given this user question, generate 3-5 alternative phrasings and related keywords that could help find relevant information:

Original Question: {question}

Generate variations that capture:
- Different ways to phrase the same question
- Related terms and synonyms
- Specific keywords that might appear in relevant documents

Alternative Queries:
`);

/**
 * Prompt for document relevance scoring
 * Helps filter the most relevant context chunks
 */
export const RELEVANCE_SCORING_TEMPLATE = PromptTemplate.fromTemplate(`
Rate how relevant this document chunk is to answering the user's question on a scale of 1-10:

Question: {question}

Document Chunk:
{chunk}

Consider:
- Direct relevance to the question
- Quality and specificity of information
- Potential to contribute to a complete answer

Relevance Score (1-10):
`);

/**
 * Helper function to format context from multiple chunks
 */
export function formatContextChunks(chunks: Array<{ content: string; metadata: any }>): string {
  return chunks
    .map((chunk, index) => {
      const source = chunk.metadata?.source || 'Unknown';
      const page = chunk.metadata?.page ? ` (Page ${chunk.metadata.page})` : '';
      return `[Source ${index + 1}: ${source}${page}]\n${chunk.content}\n`;
    })
    .join('\n---\n\n');
}

/**
 * Helper function to create a conversation-aware prompt
 */
export async function createConversationPrompt(
  question: string,
  context: string,
  conversationHistory?: Array<{ question: string; answer: string }>
): Promise<string> {
  let prompt = '';
  
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += 'Previous conversation:\n';
    conversationHistory.slice(-3).forEach(({ question: q, answer: a }) => {
      prompt += `Q: ${q}\nA: ${a}\n\n`;
    });
    prompt += '---\n\n';
  }

  const formattedPrompt = await RAG_PROMPT_TEMPLATE.format({ context, question });
  return prompt + formattedPrompt;
}