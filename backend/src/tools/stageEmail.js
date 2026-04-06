const Task = require('../models/Task');

async function stageEmail({ jobDescription, recipient, subject, body, matchLevel, matchReason, suggestions }) {
  try {
    const newTask = new Task({
      type:           'email',
      status:         'PENDING_APPROVAL',
      jobDescription,
      recipient,
      subject,
      body,
      originalPrompt: jobDescription,
      matchLevel:     matchLevel   || null,
      matchReason:    matchReason  || null,
      suggestions:    Array.isArray(suggestions) ? suggestions : [],
    });

    const savedTask = await newTask.save();
    return savedTask.toJSON();
  } catch (error) {
    console.error('Error staging email:', error);
    throw error;
  }
}

module.exports = stageEmail;