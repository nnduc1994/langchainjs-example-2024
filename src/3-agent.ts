import "dotenv/config";

import * as readlineSync from "readline-sync";
import chalk from "chalk";

import { ChatOpenAI } from "@langchain/openai";

import {
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { SystemMessage } from "@langchain/core/messages";

import { createOpenAIFunctionsAgent } from "langchain/agents";
import { AgentExecutor } from "langchain/agents";
import { DynamicTool } from "@langchain/core/tools";

const mimmitKoodaaInfo = new DynamicTool({
  name: "get_mimmitkooda_info",
  description: "Returns information about mimitkooda events info.",
  func: async () => {
    return JSON.stringify({
      events: [
        {
          name: "MIMMIT KOODAA KEVÄT 2024",
          date: "19/04/2024",
          agenda: [
            {
              time: "1:20 pm",
              topic: "LLM-centric application development",
              presenter: "Duc Nguyen",
              presenterCompany: "Nordcloud",
            },
          ],
        },
      ],
    });
  },
});

const nordcloudInfo = new DynamicTool({
  name: "get_nordcloud_info",
  description:
    "Return information related Nordcloud as a company and Nordcloud's employee",
  func: async () => {
    return JSON.stringify({
      description:
        "Nordcloud is a European leader in cloud implementation, application development, managed services and training",
      employees: [
        {
          name: "Duc Nguyen",
          skills: ["Typescript", "Javascript", "AWS", "Complaining"],
          location: "Finland",
          hasDog: true,
        },
      ],
    });
  },
});

const tools = [mimmitKoodaaInfo, nordcloudInfo];
const model = new ChatOpenAI({});

const prompt = ChatPromptTemplate.fromMessages([
  new SystemMessage("You are a helpful assistant"),
  HumanMessagePromptTemplate.fromTemplate("{input}"),
  new MessagesPlaceholder("agent_scratchpad"),
]);

const agent = await createOpenAIFunctionsAgent({
  llm: model,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
});

const chatbotWithKnowledge = async () => {
  console.log(chalk.green("Chatbot started, type exit to quit"));

  while (true) {
    const userInput = readlineSync.question(chalk.yellow("You: "));

    if (userInput === "exit") return;

    const response = await agentExecutor.invoke({ input: userInput });

    console.log(chalk.green(`Bot: ${response.output}`));
  }
};

chatbotWithKnowledge();
