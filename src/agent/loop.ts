import type { BaseProvider, Message } from "../providers/base.js";
import { readFileTool } from "../tools/read-file.js";
import { writeFileTool } from "../tools/write-file.js";
import { bashTool } from "../tools/bash.js";
import { globTool } from "../tools/glob.js";
import { parseToolCall } from "./tool-parser.js";
import { listDirTool } from "../tools/list-dir.js";

export const SYSTEM_PROMPT = `You are an AI coding assistant with access to the following tools:

- read_file(path): Read a file's contents
- write_file(path, content): Create or overwrite a file
- bash(command): Run a terminal command
- glob(pattern): Find files matching a pattern
- list_dir(path): List files in a directory

When you need to use a tool, respond with ONLY this format:
<tool_call>
{"name": "tool_name", "input": {"key": "value"}}
</tool_call>.

Always use relative paths starting with ./ (e.g. ./folder/file.ts), never absolute paths starting with /.
And when youre working on a folder structure, you can use this way
list_dir then glob then write files then glob then write file then read file then if needed bash command then use read and write till the work is finished . for example of make a todo app do these-
(use steps only when you needed)
1 check if todo app is already created if yes any files inside it 
2 if not create todo app then check again is it actually created with no spelling mistake and all 
3 then create files like html 
4 then write the html code 
5 then read it 
6 then create css file 
7 then write css file 
8 thn read it again 
9 then go to js and repeat the same process as html and css 
10 if needed only then  install commnands (use bash)
11 after everything is done check the files and read them and if needed write again and again till the work is finished And see if they are working or not.

Wait for the tool result before continuing.
When you are done with all tool calls, give your final response normally without any tool_call tags.Be concise and clear and always be nice and sweet in your response.`;

export const TOOLS = [
    {
        name: "read_file",
        description: "Read the contents of a file",
        input_schema: {
            type: "object",
            properties: {
                path: { type: "string", description: "The file path to read" },
            },
            required: ["path"],
        },
    },
    {
        name: "write_file",
        description: "Write or create a file with the given content",
        input_schema: {
            type: "object",
            properties: {
                path: { type: "string", description: "The file path to write" },
                content: { type: "string", description: "The content to write" },
            },
            required: ["path", "content"],
        },
    },
    {
        name: "bash",
        description: "Run a terminal command",
        input_schema: {
            type: "object",
            properties: {
                command: { type: "string", description: "The command to run" },
            },
            required: ["command"],
        },
    },
    {
        name: "glob",
        description: "Find files matching a pattern",
        input_schema: {
            type: "object",
            properties: {
                pattern: { type: "string", description: "Glob pattern to match files" },
            },
            required: ["pattern"],
        },
    },
    {
        name: "list_dir",
        description: "List files and folders in a directory",
        input_schema: {
            type: "object",
            properties: {
                path: { type: "string", description: "The directory path to list" },
            },
            required: ["path"],
        },
    },
];

async function executeTool(name: string, input: Record<string, string>): Promise<string> {
    switch (name) {
        case "read_file":
            return readFileTool(input.path);
        case "write_file":
            return writeFileTool(input.path, input.content);
        case "bash":
            return bashTool(input.command);
        case "glob":
            return globTool(input.pattern);
        case "list_dir":
            return listDirTool(input.path);
        default:
            return `Unknown tool: ${name}`;
    }
}

export async function runAgentLoop(
    prompt: string,
    provider: BaseProvider,
    history: Message[],
    onChunk: (chunk: string) => void
): Promise<void> {
    history.push({ role: "user", content: prompt });

    while (true) {
        let fullResponse = "";

        await provider.streamMessage(history, (chunk) => {
            fullResponse += chunk;
            if (!fullResponse.includes("<tool_call>")) {
                onChunk(chunk);
            }
        }, SYSTEM_PROMPT);

        history.push({ role: "assistant", content: fullResponse });

        // check if AI wants to use a tool
        const toolCall = parseToolCall(fullResponse);

        if (!toolCall) break;

        try {

            const toolResult = await executeTool(
                toolCall.name,
                toolCall.input
            );

            onChunk(`\n[Tool: ${toolCall.name}] → ${toolResult}\n`);

            history.push({
                role: "user",
                content: `Tool result: ${toolResult}`,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            onChunk(`\n[Tool Error] → ${errorMessage}\n`);

            history.push({
                role: "user",
                content: `Tool error: ${errorMessage}. Please try again.`,
            });
        }
    }
}

