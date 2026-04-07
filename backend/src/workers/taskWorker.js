const Task = require('../models/Task');
const mockSend = require('../services/mockSend');

async function run(task) {
  console.log(`[Worker] Starting task ${task._id} | type: ${task.type}`);

  try {
    if (task.type === 'email') {
      await handleEmail(task);
    } else if (task.type === 'invoice') {
      await handleInvoice(task);
    } else {
      console.warn(`[Worker] Unknown task type: ${task.type}. Marking stale.`);
      await setStatus(task, 'STALE');
      return;
    }

    await setStatus(task, 'COMPLETED', { completedAt: new Date() });
    console.log(`[Worker] Task ${task._id} completed successfully.`);
  } catch (err) {
    console.error(`[Worker] Task ${task._id} failed:`, err.message);
  }
}

async function handleEmail(task) {
  if (!task.recipient || !task.subject || !task.body) {
    throw new Error(`Task ${task._id} is missing email fields (recipient/subject/body).`);
  }
  console.log(`[Worker] Email prepared for ${task.recipient}. Backend send skipped (Sent via Frontend).`);
  
}

async function handleInvoice(task) {
  console.log(`[Worker] Invoice task ${task._id} — draftInvoice not yet implemented. Skipping send.`);
}

async function setStatus(task, status, extra = {}) {
  await Task.findByIdAndUpdate(task._id, { status, ...extra });
}

module.exports = { run };
