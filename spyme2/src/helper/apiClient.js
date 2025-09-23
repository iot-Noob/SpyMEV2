import axios from "axios";
 
// Vite env variables: import.meta.env.VITE_API_URL / VITE_WS_URL
const API_URL = import.meta.env.VITE_API_URL
const WS_URL = import.meta.env.VITE_WS_URL

console.log(API_URL)

// --- Axios instance ---
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- REST API Helpers ---
export async function registerUser(username) {
  try {
    const res = await api.post("/register_user", { username });
    return res.data;
  } catch (err) {
    throw formatError(err);
  }
}

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

export async function deleteUser(id) {
  try {
    const res = await api.delete(`/delete_data?id=${id}`);
    return res.data;
  } catch (err) {
    throw formatError(err);
  }
}

export async function getUsers(id = null) {
  try {
    const res = await api.get("/get_users", { params: id ? { id } : {} });
    return res.data;
  } catch (err) {
    throw formatError(err);
  }
}

// --- WebSocket Helper ---
export function createSignalingSocket(userId, handlers = {}) {
  const socket = new WebSocket(`${WS_URL}?id=${userId}`);

  socket.onopen = () => {
    console.log("WebSocket connected");
    handlers.onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handlers.onMessage?.(data);
    } catch (e) {
      console.error("Failed to parse WS message", e);
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error", error);
    handlers.onError?.(error);
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
    handlers.onClose?.();
  };

  // send wrapper
  function send(action, payload) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action, payload }));
    } else {
      console.warn("WebSocket not open");
    }
  }

  return { socket, send };
}

// --- Format Axios Errors ---
function formatError(err) {
  if (err.response) {
    return { status: err.response.status, data: err.response.data };
  }
  return { message: err.message };
}
