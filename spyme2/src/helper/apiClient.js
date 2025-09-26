import axios from "axios";

/**
 * @constant {string} API_URL - Base URL for REST API from Vite env variable
 */
const API_URL = import.meta.env.VITE_API_URL;

/**
 * @constant {string} WS_URL - Base URL for WebSocket server from Vite env variable
 */
const WS_URL = import.meta.env.VITE_WS_URL;

console.log(API_URL);

/**
 * Axios instance for API requests
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Register a new user
 * @param {string} username - Username to register
 * @returns {Promise<import("axios").AxiosResponse>} Full Axios response
 * @throws {Error} Throws axios error if registration fails
 */
export async function registerUser(username) {
  try {
    const res = await api.post("/register_user", { username });
    return res;
  } catch (err) {
    throw err;
  }
}

/**
 * Update a user's name
 * @param {number|string} id - User ID to update
 * @param {string} uname - New username
 * @returns {Promise<Object>} Response data
 * @throws {Error} Throws formatted error if update fails
 */
export async function updateUser(id, uname) {
  try {
    const form = new FormData();
    form.append("uname", uname);
    const res = await api.patch(`/update_user?id=${id}`, form);
    return res.data;
  } catch (err) {
    throw formatError(err);
  }
}

/**
 * Delete a user by ID
 * @param {number|string} id - User ID to delete
 * @returns {Promise<import("axios").AxiosResponse>} Full Axios response
 * @throws {Error} Throws error if ID is invalid or deletion fails
 */
export async function deleteUser(id) {
  const parsedId = Number(id);
  if (Number.isNaN(parsedId)) {
    throw new Error(`Invalid id: ${id}`);
  }

  try {
    const res = await api.delete(`/delete_data?id=${parsedId}`);
    return res;
  } catch (err) {
    throw err;
  }
}

/**
 * Get users or a specific user by ID
 * @param {number|string|null} [id=null] - Optional user ID
 * @returns {Promise<Object|Array>} User data
 * @throws {Error} Throws formatted error if request fails
 */
export async function getUsers(id = null) {
  try {
    const res = await api.get("/get_users", { params: id ? { id } : {} });
    return res.data;
  } catch (err) {
    throw formatError(err);
  }
}

/**
 * Create a WebSocket connection for signaling
 * @param {string|number} userId - Current user ID
 * @param {Object} [handlers={}] - Event handlers for the WebSocket
 * @param {function():void} [handlers.onOpen] - Called when WS connects
 * @param {function(Object):void} [handlers.onMessage] - Called on incoming WS message
 * @param {function(Event):void} [handlers.onError] - Called on WS error
 * @param {function():void} [handlers.onClose] - Called when WS disconnects
 * @returns {{socket: WebSocket, send_data: function(string, Object=): void}} WS object with send wrapper
 */
export function createSignalingSocket(userId, handlers = {}) {
  const socket = new WebSocket(`${WS_URL}?id=${userId}&role=master`);

  // WebSocket event handlers
  socket.onopen = () => {
    console.log("WebSocket connected");
    if (handlers.onOpen) handlers.onOpen();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (handlers.onMessage) handlers.onMessage(data);
    } catch (e) {
      console.error("Failed to parse WS message", e, event.data);
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error", error);
    if (handlers.onError) handlers.onError(error);
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
    if (handlers.onClose) handlers.onClose();
  };

  /**
   * Send a message through the WebSocket
   * @param {string} action - Action name to send
   * @param {Object} [payload={}] - Payload object
   */
  function send_data(action, payload = {}) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          action,
          payload,
        })
      );
    } else {
      console.warn("WebSocket not open, cannot send", { action, payload });
    }
  }

  return { socket, send_data };
}
