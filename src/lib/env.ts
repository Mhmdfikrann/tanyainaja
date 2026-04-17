const requiredServerEnv = ["DATABASE_URL", "NEXTAUTH_SECRET"] as const;

function inferVisionSupport(model: string, baseUrl: string) {
  if (!/api\.openai\.com\/v1/i.test(baseUrl)) {
    return false;
  }

  return /(4o|vision|omni)/i.test(model);
}

for (const key of requiredServerEnv) {
  if (!process.env[key]) {
    console.warn(`Missing required environment variable: ${key}`);
  }
}

const aiBaseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
const aiModel = process.env.AI_MODEL ?? "gpt-4o-mini";
const aiSupportsVision =
  process.env.AI_SUPPORTS_VISION != null
    ? process.env.AI_SUPPORTS_VISION === "true"
    : inferVisionSupport(aiModel, aiBaseUrl);

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? "",
  nextAuthUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  authOtpWebhookUrl: process.env.AUTH_OTP_WEBHOOK_URL ?? "",
  authOtpWebhookToken: process.env.AUTH_OTP_WEBHOOK_TOKEN ?? "",
  authOtpCodeTtlSec: Number.parseInt(process.env.AUTH_OTP_CODE_TTL_SEC ?? "300", 10),
  authOtpResendCooldownSec: Number.parseInt(process.env.AUTH_OTP_RESEND_COOLDOWN_SEC ?? "60", 10),
  authOtpMaxAttempts: Number.parseInt(process.env.AUTH_OTP_MAX_ATTEMPTS ?? "5", 10),
  aiBaseUrl,
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiModel,
  aiSupportsVision,
  publicAiSupportsVision: aiSupportsVision,
};
