import Conf from "conf";
import type { ProviderName } from "../providers/factory.js";
import type { CliMode } from "../agent/modes.js";

type UserConfig = {
  provider: ProviderName;
  mode: CliMode;
};

export const config = new Conf<UserConfig>({
  projectName: "anas-cli",
  defaults: {
    provider: "openai",
    mode: "agent",
  },
});
