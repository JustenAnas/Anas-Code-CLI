import { select } from "@inquirer/prompts";

type ToolInput = Record<string, string>;

export type PermissionResult =
  | {
      behavior: "allow";
      updatedInput: ToolInput;
    }
  | {
      behavior: "deny";
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

  console.log(`\n[Permission Required]\n${toolName}:\n${preview}\n`);

  try {
    const approved = await select<"yes" | "no">({
      message: "Allow this action?",
      choices: [
        { name: "Yes (Y / Enter)", value: "yes" },
        { name: "No (N)", value: "no" },
      ],
      default: "yes",
    });

    return approved === "yes"
      ? { behavior: "allow", updatedInput: input }
      : { behavior: "deny" };
  } catch {
    return { behavior: "deny" };
  }
};
