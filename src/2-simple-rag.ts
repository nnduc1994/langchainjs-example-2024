import "dotenv/config";

import * as path from "path";
import * as readlineSync from "readline-sync";
import chalk from "chalk";

import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { formatDocumentsAsString } from "langchain/util/document";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

import { SystemMessagePromptTemplate } from "@langchain/core/prompts";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatOpenAI({});
const loader = new PDFLoader(
  path.join(path.resolve(), "./src/text/senior_salary.pdf")
);
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1536,
  chunkOverlap: 128,
});
const embeddings = new OpenAIEmbeddings();
const output = new StringOutputParser();
const vectorstore = new MemoryVectorStore(embeddings);

const chatbotWithKnowledge = async () => {
  const rawDoc = await loader.load();
  const splitDocs = await splitter.splitDocuments(rawDoc);

  await vectorstore.addDocuments(splitDocs);
  const retriever = vectorstore.asRetriever({ k: 5 });

  const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
    Repeat the question (in the format, question: {question}) and answer user question in a polite way.
    User question: {question}
    Use the context below if needed.
    ----
    {context}`);

  const salaryChain = RunnableSequence.from([
    {
      question: new RunnablePassthrough(),
      context: retriever.pipe(formatDocumentsAsString),
    },
    systemPrompt,
    model,
    output,
  ]);

  console.log(chalk.green("Chatbot started, type exit to quit"));

  while (true) {
    const userInput = readlineSync.question(chalk.yellow("You: "));

    if (userInput === "exit") return;

    const response = await salaryChain.invoke(userInput);

    console.log(chalk.green(`Bot: ${response}`));
  }
};

chatbotWithKnowledge();
