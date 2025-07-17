# Groq-Llama-Genesis: Retrieval-Augmented Generation (RAG) System

## Overview

**Groq-Llama-Genesis** is a modern Retrieval-Augmented Generation (RAG) web application that enables users to upload documents, build a knowledge base, and interact with an AI assistant powered by Groq LLMs and LangChain. The system retrieves relevant information from your documents to answer questions with context-aware, accurate responses.

---

## Features

- **Document Upload & Knowledge Base**: Upload PDF, TXT, or DOCX files to create a searchable knowledge base.
- **Contextual Q&A**: Ask questions and receive answers grounded in your uploaded documents.
- **Streaming Chat Interface**: Real-time, conversational UI for interacting with the AI assistant.
- **Configurable RAG Pipeline**: Adjust model, temperature, chunking, and other parameters.
- **Analytics & Management**: View stats, clear conversation history, or reset the knowledge base.
- **Modern UI**: Built with React, shadcn-ui, and Tailwind CSS for a responsive, accessible experience.

---

## Technologies Used

- [Vite](https://vitejs.dev/) (build tool)
- [React](https://react.dev/) (UI framework)
- [TypeScript](https://www.typescriptlang.org/) (type safety)
- [shadcn-ui](https://ui.shadcn.com/) (UI components)
- [Tailwind CSS](https://tailwindcss.com/) (utility-first CSS)
- [LangChain](https://js.langchain.com/) (RAG orchestration)
- [Groq](https://console.groq.com/) (LLM provider)

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/) (for dependency management)

### Installation

```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd groq-llama-genesis

# 2. Install dependencies
npm install
# or
bun install
```

### Running the Development Server

```sh
npm run dev
# or
bun run dev
```

The app will be available at [http://localhost:8080](http://localhost:8080) by default.

---

## Usage

1. **Initialize the RAG System**: On first load, enter your [Groq API key](https://console.groq.com/keys) and configure model parameters as desired.
2. **Upload Documents**: Add PDF, TXT, or DOCX files to your knowledge base.
3. **Ask Questions**: Use the chat interface to ask questions. The AI will answer using only the information from your uploaded documents.
4. **Manage Data**: Use the Analytics and Settings tabs to view stats, clear history, or reset the knowledge base.

---

## Configuration

You can configure the following parameters in the UI:
- **Groq API Key** (required)
- **Model**: Choose from Llama 3.1 8B, Mixtral 8x7B, or Llama 3.1 70B
- **Temperature**: Controls randomness of responses
- **Max Tokens**: Maximum length of generated answers
- **Top K**: Number of context chunks to retrieve
- **Chunk Size / Overlap**: Controls document splitting granularity

No `.env` file is required; all configuration is handled in the UI.

---

## Supported Document Types

- PDF (`.pdf`)
- Plain Text (`.txt`)
- Microsoft Word (`.docx`)

Maximum file size: **10MB** per document.

---

## Building for Production

```sh
npm run build
# or
bun run build
```

The production-ready files will be output to the `dist/` directory. You can deploy these files to any static hosting provider (e.g., Vercel, Netlify, GitHub Pages, etc.).

To preview the production build locally:

```sh
npm run preview
# or
bun run preview
```

---

## License

This project is provided as-is for educational and research purposes. See [LICENSE](LICENSE) for details.

---

## Acknowledgments
- [LangChain](https://js.langchain.com/)
- [Groq](https://console.groq.com/)
- [shadcn-ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
