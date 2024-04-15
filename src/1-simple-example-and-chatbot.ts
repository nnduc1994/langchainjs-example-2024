import "dotenv/config";
import * as readlineSync from "readline-sync";
import chalk from "chalk";

import { ChatOpenAI } from "@langchain/openai";

import {
  PromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  StringOutputParser,
  JsonOutputParser,
} from "@langchain/core/output_parsers";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo", temperature: 0.1 });
const stringOutput = new StringOutputParser();

//#region functions
const simpleExample = async () => {
  const prompt = PromptTemplate.fromTemplate(
    "What could be a good name for a {animal}"
  );

  const formattedPrompt = await prompt.format({ animal: "dog" });
  const response = await model.invoke(formattedPrompt);

  console.log("Questions: ", formattedPrompt);
  console.log(response.content);
};

const chatbot = async () => {
  console.log(chalk.green("Chatbot started, type exit to quit"));

  while (true) {
    const userInput = readlineSync.question(chalk.yellow("You: "));

    if (userInput === "exit") return;

    // const systemMessage = "You are from 15th centery, speak like one";

    const response = await model.invoke([
      // new SystemMessage(systemMessage),
      new HumanMessage(userInput),
    ]);

    console.log(chalk.green(`Bot: ${response.content}`));
  }
};

const chatbotWithMemory = async () => {
  console.log(chalk.green("Chatbot started, type exit to quit"));
  const chatHistory = [];

  const prompt = ChatPromptTemplate.fromMessages([
    new SystemMessage("You are a helpful virtual assistant"),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate("{message}"),
  ]);

  const withMemoryChain = RunnableSequence.from([prompt, model, stringOutput]);

  while (true) {
    const userInput = readlineSync.question(chalk.yellow("You: "));

    if (userInput === "exit") return;

    const response = await withMemoryChain.invoke({
      message: userInput,
      history: chatHistory,
    });

    chatHistory.push(new HumanMessage(userInput), new AIMessage(response));

    console.log(chalk.green(`Bot: ${response}`));
  }
};
//#endregion

//simpleExample();
//chatbot();
chatbotWithMemory();
