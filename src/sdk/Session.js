import axios from 'axios';
import { API_URL } from '../constants';

function getRandomUserId() {
  return Math.random().toString(36).slice(2);
}

async function createSession({ username }) {
  const response = await axios.post(`${API_URL}create`, {
    userId: getRandomUserId(),
    attributes: { username }
  });

  const data = response.data;
  const token = data.stage.token.token;
  const attributes = data.stage.token.attributes;
  const sessionId = data.sessionId;
  const expiration = data.expiration;

  return { token, attributes, sessionId, expiration };
}

function createSessionWithToken(token) {
  const attributes = token.attributes;
  const sessionId = token.topic;
  const expiration = token.exp;
  const hasPublish = token.capabilities.allow_publish === true;

  return { token, attributes, sessionId, expiration, hasPublish };
}

async function getSessionToken(id, username) {
  if (!id) return;

  const userId = getRandomUserId();

  const response = await axios.post(`${API_URL}join`, {
    sessionId: id,
    userId: userId,
    attributes: { username },
  });

  const data = response.data;
  const token = data.stage.token.token;
  const attributes = data.stage.token.attributes;
  const expiration = data.expiration;

  return { token, attributes, expiration };
}

export { getSessionToken, createSession, createSessionWithToken };
