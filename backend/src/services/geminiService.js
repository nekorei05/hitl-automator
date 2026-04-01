const { GoogleGenerativeAI } = require('@google/generative-ai');
const getProfile = require('../tools/getProfile');
const stageEmail = require('../tools/stageEmail');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

const systemInstruction = `You are an autonomous outreach assistant.

Before writing any email:
1. You MUST call the tool \`get_my_profile\` to fetch user skills and projects.
2. Analyze the job description against the profile.
3. If the user is a reasonable match, generate a professional outreach email.
4. Then call the tool \`stage_outreach\` (stageEmail) to save the email as a task.

Rules:
* DO NOT fabricate skills.
* DO NOT skip calling get_my_profile.
* DO NOT directly output the email.
* ALWAYS use tools for actions.`;

const tools = [
  {
    functionDeclarations: [
      {
        name: "get_my_profile",
        description: "Fetch the user's profile details including skills and projects.",
      },
      {
        name: "stage_outreach",
        description: "Stage the generated outreach email as a task.",
        parameters: {
          type: "OBJECT",
          properties: {
            jobDescription: { type: "STRING", description: "The original job description." },
            recipient: { type: "STRING", description: "The recipient's email address." },
            subject: { type: "STRING", description: "The email subject." },
            body: { type: "STRING", description: "The email body." }
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
  console.log("new prompot received");
  console.log("Job Description", jobDescription);
  const chat = model.startChat({});
  let result = await chat.sendMessage(`Here is the job description:\n${jobDescription}`);
  console.log("initial ai response: ", result.response.text());

  let stagedTask = null;

  let calls = result.response.functionCalls();
  while (calls && calls.length > 0) {
    const call = calls[0];

    console.log("\n TOOL CALL DETECTED");
    console.log(" Tool Name:", call.name);
    console.log(" Arguments:", call.args);

    let toolResult;

    if (call.name === 'get_my_profile') {
      console.log(" Fetching profile from DB...");

      const profileInfo = await getProfile();
      console.log(" Profile Data:", profileInfo);

      toolResult = { profile: profileInfo };
    } else if (call.name === 'stage_outreach') {
      const args = call.args;
      stagedTask = await stageEmail({
        jobDescription: args.jobDescription,
        recipient: args.recipient,
        subject: args.subject,
        body: args.body
      });
      toolResult = { success: true, taskId: stagedTask._id };
    } else {
      toolResult = { error: "Unknown tool" };
    }

    result = await chat.sendMessage([{
      functionResponse: {
        name: call.name,
        response: toolResult
      }
    }]);
    console.log("AI Response after tool:", result.response.text());

    calls = result.response.functionCalls();
  }
  console.log("\n FINAL RESULT:");
  console.log(" AI Final Text:", result.response.text());
  console.log(" Task:", stagedTask);
  return { text: result.response.text(), task: stagedTask };
}

module.exports = { processPrompt };
