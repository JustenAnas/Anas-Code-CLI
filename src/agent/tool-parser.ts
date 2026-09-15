export function parseToolCall(response: string) {
    // Count actual tool-call structures, not mentions of tool names.
    const standardCalls =
        response.match(/<tool_call>[\s\S]*?<\/tool_call>/g) || [];

    const taggedCalls =
        response.match(
            /<(read_file|write_file|bash|glob|list_dir)\b[^>]*>([\s\S]*?)<\/\1>/g
        ) || [];

    const selfClosingCalls =
        response.match(
            /<(read_file|write_file|bash|glob|list_dir)\s+[^>]*?\/>/g
        ) || [];

    const functionCalls =
        response.match(
            /(?:read_file|write_file|bash|glob|list_dir)\([\s\S]*?\)/g
        ) || [];

    const toolCallCount =
        standardCalls.length +
        taggedCalls.length +
        selfClosingCalls.length +
        functionCalls.length;

    if (toolCallCount > 1) {
        return { invalid: true };
    }

    // Standard <tool_call> format
    const toolCallMatch = response.match(
        /<tool_call>([\s\S]*?)<\/tool_call>/
    );

    if (toolCallMatch) {
        try {
            return JSON.parse(toolCallMatch[1]);
        } catch {}
    }

    // Tool tag containing JSON
    const toolTagMatch = response.match(
        /<(read_file|write_file|bash|glob|list_dir)[^>]*>([\s\S]*?)<\/\1>/
    );

    if (toolTagMatch) {
        try {
            const jsonMatch = toolTagMatch[2].match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch {}
    }

    // Self-closing tag with attributes
    const selfClosingMatch = response.match(
        /<(read_file|write_file|bash|glob|list_dir)\s+([^>]*?)\/>/
    );

    if (selfClosingMatch) {
        const attributes = selfClosingMatch[2];
        const input: Record<string, string> = {};

        for (const match of attributes.matchAll(/(\w+)="([^"]*)"/g)) {
            input[match[1]] = match[2];
        }

        if (Object.keys(input).length > 0) {
            return {
                name: selfClosingMatch[1],
                input,
            };
        }

        // Self-closing tag containing JSON
        const jsonMatch = attributes.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {}
        }
    }

    // Function-call style
    const functionMatch = response.match(
        /(read_file|write_file|bash|glob|list_dir)\(([\s\S]*?)\)/
    );

    if (functionMatch) {
        // Function call containing JSON object
        try {
            const parsed = JSON.parse(functionMatch[2]);

            if (parsed.name && parsed.input) {
                return parsed;
            }
        } catch {}

        const input: Record<string, string> = {};

        for (const match of functionMatch[2].matchAll(
            /(\w+)="([^"]*)"/g
        )) {
            input[match[1]] = match[2];
        }

        if (Object.keys(input).length > 0) {
            return {
                name: functionMatch[1],
                input,
            };
        }

        // Function call with positional arguments
        try {
            const args = JSON.parse(`[${functionMatch[2]}]`);

            return {
                name: functionMatch[1],
                input:
                    functionMatch[1] === "write_file"
                        ? { path: args[0], content: args[1] }
                        : functionMatch[1] === "bash"
                            ? { command: args[0] }
                            : functionMatch[1] === "glob"
                                ? { pattern: args[0] }
                                : { path: args[0] },
            };
        } catch {}
    }

    return null;
}