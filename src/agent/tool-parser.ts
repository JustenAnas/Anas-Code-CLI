export function parseToolCall(response: string) {
    // Standard format
    const toolCallMatch = response.match(
        /<tool_call>([\s\S]*?)<\/tool_call>/
    );

    if (toolCallMatch) {
        try {
            return JSON.parse(toolCallMatch[1]);
        } catch { }
    }

    // OpenRouter: tool tag with JSON inside
    const toolTagMatch = response.match(
        /<(read_file|write_file|bash|glob|list_dir)[^>]*>([\s\S]*?)<\/\1>/
    );

    if (toolTagMatch) {
        try {
            const jsonMatch = toolTagMatch[2].match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch { }
    }

    // OpenRouter self-closing format
    const selfClosingMatch = response.match(
        /<(read_file|write_file|bash|glob|list_dir)\s+([^>]*?)\/>/
    );

    if (selfClosingMatch) {
        const attributes = selfClosingMatch[2];
        const input: Record<string, string> = {};

        for (const match of attributes.matchAll(/(\w+)="([^"]*)"/g)) {
            input[match[1]] = match[2];
        }

        return {
            name: selfClosingMatch[1],
            input,
        };
    }

    // OpenRouter function-call style
    // OpenRouter function-call style
    const functionMatch = response.match(
        /(read_file|write_file|bash|glob|list_dir)\(([\s\S]*)\)/
    );

    if (functionMatch) {
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
        } catch { }
    }

    return null;
}