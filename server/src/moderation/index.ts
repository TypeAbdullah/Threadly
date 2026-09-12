import { ModerationDecision } from "@threadly/types";

export interface ModerationResult {
  decision: ModerationDecision;
  flaggedCategories: string[];
  score: number;
  reason?: string;
}

export interface ModerationProvider {
  name: string;
  moderate(content: string): Promise<ModerationResult>;
}

// Built-in rule-based and heuristic moderation provider
export class DefaultRuleModerationProvider implements ModerationProvider {
  public name = "rule-heuristic-provider";

  private profanityList = [
    "badword1",
    "badword2",
    "scam",
    "free crypto",
    "airdrop token",
    "whatsapp me",
    "t.me/",
    "free money",
    "viagra",
  ];

  public async moderate(content: string): Promise<ModerationResult> {
    const lower = content.toLowerCase();
    const flaggedCategories: string[] = [];

    // 1. Spam detection: excessive URLs
    const urlMatches = content.match(/https?:\/\/[^\s]+/g) || [];
    if (urlMatches.length > 2) {
      flaggedCategories.push("spam");
    }

    // 2. Repetitive character spam (e.g. "aaaaaaaaaaaaaa")
    if (/(.)\1{9,}/.test(content)) {
      flaggedCategories.push("spam");
    }

    // 3. Keyword / profanity detection
    for (const word of this.profanityList) {
      if (lower.includes(word)) {
        if (word.includes("crypto") || word.includes("t.me") || word.includes("whatsapp")) {
          flaggedCategories.push("spam");
        } else {
          flaggedCategories.push("profanity");
        }
      }
    }

    // 4. Decision logic
    if (flaggedCategories.includes("spam")) {
      return {
        decision: "rejected",
        flaggedCategories,
        score: 0.95,
        reason: "Detected unsolicited promotion or repetitive spam.",
      };
    }

    if (flaggedCategories.includes("profanity")) {
      return {
        decision: "pending",
        flaggedCategories,
        score: 0.65,
        reason: "Flagged for language review by moderator.",
      };
    }

    return {
      decision: "approved",
      flaggedCategories: [],
      score: 0.0,
    };
  }
}

let activeProvider: ModerationProvider = new DefaultRuleModerationProvider();

export const setModerationProvider = (provider: ModerationProvider) => {
  activeProvider = provider;
};

export const runModerationPipeline = async (
  content: string,
  options: { spamFilterEnabled?: boolean; profanityFilterEnabled?: boolean } = {}
): Promise<ModerationResult> => {
  const result = await activeProvider.moderate(content);

  // If user disabled profanity filter on their site, ignore profanity flags
  if (options.profanityFilterEnabled === false) {
    result.flaggedCategories = result.flaggedCategories.filter((c) => c !== "profanity");
    if (result.decision === "pending" && result.flaggedCategories.length === 0) {
      result.decision = "approved";
    }
  }

  return result;
};
