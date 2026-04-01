const mockSend = async (task) => {
  console.log(`Sending email to ${task.recipient} with subject ${task.subject}`);
  return true;
};

module.exports = mockSend;
