const { GoogleGenerativeAI } = require('@google/generative-ai');
const getProfile = require('../tools/getProfile');
const stageEmail = require('../tools/stageEmail');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
You are an AI assistant that writes cold emails for job applications.

Your goal is to write emails that feel human, confident and tailored — NOT generic.

-------------------------

WORKFLOW:

1. Call the tool get_my_profile
2. Analyze job description vs profile
3. Determine match level: HIGH / MEDIUM / LOW
4. ALWAYS generate an email (never skip)
5. Generate 2–3 improvement suggestions based on missing skills
6. Call the tool stage_outreach

-------------------------

WRITING RULES:

- DO NOT use phrases like:
  "I am writing to express my interest"
  "I am eager to apply"
  "I would like to apply"

- Start naturally:
  "I came across your opening..."
  "I've been working on..."
  "This role caught my attention..."

- Mention 2–3 relevant skills from job description
- Mention real projects (MEWse, Quiz App)
- Keep it short (120–160 words)

TONE:
- HIGH → confident
- MEDIUM → balanced
- LOW → honest, acknowledge gap clearly, show intent to learn (not confident tone)
-------------------------

IMPORTANT RULES:

- NEVER refuse to generate email
- DO NOT fabricate skills
- ALWAYS call get_my_profile first
- ALWAYS call stage_outreach after generating email

-------------------------

SUGGESTIONS:

Also generate 2–3 improvement suggestions:
- Identify missing skills
- Be actionable
- Be relevant to the job

-------------------------

OUTPUT:

Call stage_outreach with:

{
  jobDescription,
  recipient,
  subject,
  body,
  matchLevel,
  matchReason,
  suggestions
}
`;

const tools = [
  {
    functionDeclarations: [
      {
        name: "get_my_profile",
        description: "Fetch the user's profile details including skills and projects."
      },
      {
        name: "stage_outreach",
        description: "Stage the generated outreach email as a task.",
        parameters: {
          type: "OBJECT",
          properties: {
            jobDescription: { type: "STRING" },
            recipient: { type: "STRING" },
            subject: { type: "STRING" },
            body: { type: "STRING" },
            matchLevel: { type: "STRING" },
            matchReason: { type: "STRING" },
            suggestions: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["jobDescription", "recipient", "subject", "body"]
        }
      }
    ]
  }
];

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction,
  tools
});

async function processPrompt(jobDescription) {
  try {
    console.log("\n=== NEW TASK ===");
    console.log("Job Description:", jobDescription);

    const chat = model.startChat({});
    let result = await chat.sendMessage(
      `Analyze and generate outreach for this job:\n${jobDescription}`
    );

    let stagedTask = null;
    let calls = result.response.functionCalls();

    while (calls && calls.length > 0) {
      const call = calls[0];

      console.log("\n🔧 TOOL CALL:", call.name);

      let toolResult;

      if (call.name === "get_my_profile") {
        const profile = await getProfile();
        console.log("Profile fetched");
        toolResult = { profile };
      }

      else if (call.name === "stage_outreach") {
        const args = call.args;

        console.log("Staging email...");
        console.log("Match Level:", args.matchLevel);
        console.log("Match Reason:", args.matchReason);

        stagedTask = await stageEmail({
          jobDescription: args.jobDescription,
          recipient: args.recipient || "hiring_manager@example.com",
          subject: args.subject,
          body: args.body,
          matchLevel: args.matchLevel,
          matchReason: args.matchReason,
          suggestions: args.suggestions || []
        });

        toolResult = {
          success: true,
          taskId: stagedTask._id
        };
      }

      else {
        toolResult = { error: "Unknown tool" };
      }

      result = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: toolResult
          }
        }
      ]);

      calls = result.response.functionCalls();
    }

    console.log("\n=== FINAL ===");
    console.log("Task created:", stagedTask?._id);

    return {
      success: true,
      task: stagedTask
    };

  } catch (error) {
    console.error("AI PROCESS ERROR:", error);

    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { processPrompt };