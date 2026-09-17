import { confirm } from "@inquirer/prompts";

type ToolInput = Record<string, string>;

type PermissionResult =
| {
behavior: "allow";
updatedInput: ToolInput;
}
| {
behavior: "deny";
message: string;
};

const dangerousTools = ["bash", "write_file", "edit_file"];

export const promptBeforeToolUse = async (
toolName: string,
input: ToolInput,
): Promise<PermissionResult> => {
if (!dangerousTools.includes(toolName)) {
return {
behavior: "allow",
updatedInput: input,
};
}

const preview = JSON.stringify(input, null, 2).slice(0, 300);

try {
const approved = await confirm({
message: `\n[Permission Required]\n${toolName}:\n${preview}\n\nAllow?`,
default: true,
});

 
if (approved) {
  return {
    behavior: "allow",
    updatedInput: input,
  };
}

return {
  behavior: "deny",
  message: "User denied tool use",
};


} catch {
return {
behavior: "deny",
message: "User denied tool use",
};
}
};
