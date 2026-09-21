const PROTECTED_FILE_PATTERNS = [
  /^\.env$/i,
  /^\.env\..+$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /^credentials\./i,
  /^secrets?\./i,
];

const PROTECTED_DIRECTORIES = ["node_modules", ".git"];

const RESTRICTED_PROJECT_FILES = [
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
];

const SECRET_PATTERNS = [
  // Environment/config secrets
  /(\b(?:api[_-]?key|secret|password|token|access[_-]?token)\b\s*[:=]\s*)[^\s#]+/gi,

  // Common API-key formats
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,

  // Private keys
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
];

export function redactSecrets(text: string): string {
  let redacted = text;

  // Preserve the configuration name:
  // GEMINI_API_KEY=actual-secret
  // becomes:
  // GEMINI_API_KEY=[REDACTED SECRET]
  redacted = redacted.replace(
    /(\b[A-Z0-9_]*(?:API[_-]?KEY|SECRET|PASSWORD|TOKEN|ACCESS[_-]?TOKEN)\b\s*=\s*)[^\r\n#]+/gi,
    "$1[REDACTED SECRET]",
  );

  // Redact other detected secret formats.
  for (const pattern of SECRET_PATTERNS.slice(1)) {
    redacted = redacted.replace(pattern, "[REDACTED SECRET]");
  }

  return redacted;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?prior\s+instructions/i,
  /disregard\s+(all\s+)?previous\s+instructions/i,
  /system\s+prompt/i,
  /reveal\s+(your|the)\s+(system|hidden)\s+prompt/i,
  /developer\s+message/i,
  /override\s+(the\s+)?system/i,
];

const ABUSIVE_PATTERNS = [
  // Keep this list intentionally small.
  // We should expand it through testing rather than blocking
  // legitimate programming vocabulary.
  /\bfuck(?:ing|ed|er)?\b/i,
  /\bshit\b/i,
  /\bbitch\b/i,
  /\basshole\b/i,
];

export type GuardrailResult = {
  allowed: boolean;
  reason?: string;
  warning?: string;
};

export function isProtectedPath(path: string): GuardrailResult {
  const normalized = path.replace(/\\/g, "/").replace(/^\.\/+/, "");

  const parts = normalized.split("/").filter(Boolean);
  const fileName = parts.at(-1) ?? "";

  if (parts.some((part) => PROTECTED_DIRECTORIES.includes(part))) {
    return {
      allowed: false,
      reason: `Protected directory: ${parts.find((part) =>
        PROTECTED_DIRECTORIES.includes(part),
      )}`,
    };
  }

  if (
    RESTRICTED_PROJECT_FILES.some(
      (file) => file.toLowerCase() === fileName.toLowerCase(),
    )
  ) {
    return {
      allowed: false,
      reason: `Protected project file: ${fileName}. Explicit user permission is required.`,
    };
  }

  if (PROTECTED_FILE_PATTERNS.some((pattern) => pattern.test(fileName))) {
    return {
      allowed: false,
      reason: `Protected sensitive file: ${fileName}`,
    };
  }

  return { allowed: true };
}

export function allowsRestrictedFileChange(userPrompt: string): boolean {
  const prompt = userPrompt.toLowerCase();

  const intentPatterns = [
    // /\b(package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml)\b/,
    /\b(install|add|remove|uninstall|update|upgrade)\b.*\b(dependenc|package|npm|yarn|pnpm)\b/,
    /\b(npm|yarn|pnpm)\b.*\b(install|add|remove|uninstall|update|upgrade)\b/,
    /\b(change|modify|edit|update)\b.*\b(package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml)\b/,
  ];

  return intentPatterns.some((pattern) => pattern.test(prompt));
}

export function containsSecret(text: string): boolean {
  return SECRET_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

export function containsPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function containsAbusiveLanguage(text: string): boolean {
  return ABUSIVE_PATTERNS.some((pattern) => pattern.test(text));
}

export function isDestructiveCommand(command: string): GuardrailResult {
  const normalized = command.trim().toLowerCase();

  const destructivePatterns = [
    /(^|\s)del(\s|$)/,
    /(^|\s)erase(\s|$)/,
    /(^|\s)rmdir(\s|$)/,
    /(^|\s)rd(\s|$)/,
    /(^|\s)rm(\s|$)/,
    /(^|\s)remove-item(\s|$)/,
    /\bformat\s+[a-z]:/i,
  ];

  if (destructivePatterns.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      reason: "Potentially destructive command blocked.",
    };
  }

  return { allowed: true };
}

export function inputGuardrail(input: string): GuardrailResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      allowed: false,
      reason: "Input cannot be empty.",
    };
  }

  if (trimmed.length > 100_000) {
    return {
      allowed: false,
      reason: "Input is too large.",
    };
  }

  if (trimmed.length > 50_000) {
    return {
      allowed: true,
      warning:
        "Large input detected. This may use a significant amount of context.",
    };
  }

  if (containsAbusiveLanguage(trimmed)) {
    return {
      allowed: false,
      reason:
        "Abusive language is not allowed.You may get banned if you keep using this language",
    };
  }

  if (containsPromptInjection(trimmed)) {
    return {
      allowed: false,
      reason: "Potential prompt injection detected.",
    };
  }

  return { allowed: true };
}

export function outputGuardrail(output: string): GuardrailResult {
  if (!output.trim()) {
    return {
      allowed: false,
      reason: "The model returned an empty response.",
    };
  }

  if (containsSecret(output)) {
    return {
      allowed: false,
      reason: "Potential secret detected in model output.",
    };
  }

  return { allowed: true };
}
