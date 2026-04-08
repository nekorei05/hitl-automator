import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getTasks = () => API.get("/tasks");
export const createTask = (input) => API.post("/tasks", { input });
export const approveTask = (id) => API.post(`/tasks/${id}/approve`);
export const rejectTask = (id, reason) => API.post(`/tasks/${id}/reject`, { reason });

export default API;
