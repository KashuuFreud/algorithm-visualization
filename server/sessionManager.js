const sessions = new Map();

function createSession(clientId) {
  sessions.set(clientId, {
    steps: [],
    currentIndex: 0,
    paused: false,
    timer: null
  });
}

function getSession(clientId) {
  return sessions.get(clientId);
}

function removeSession(clientId) {
  const session = sessions.get(clientId);

  if (session && session.timer) {
    clearInterval(session.timer);
  }

  sessions.delete(clientId);
}

module.exports = {
  createSession,
  getSession,
  removeSession
};