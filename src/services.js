import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getVideosByOrderId = async (orderId) => {
  const response = await api.get(`/videos/order/${orderId}`);
  return response.data;
};

const getVideoTypes = async () => {
  const response = await api.get("/videos/types");
  return response.data;
};

const addComments = async (commentData, videoId) => {
  const response = await api.post(`/videos/${videoId}/comments`, commentData);
  return response.data;
};

const getComments = async (videoId) => {
  const response = await api.get(`/comments/video/${videoId}`);
  return response.data?.comments || [];
};

const getLikes = async (videoId) => {
  const response = await api.get(`/likes/video/${videoId}`);
  return response.data.data || [];
};

const addLike = async (likeData, videoId) => {
  const response = await api.post(`/videos/${videoId}/likes`, likeData);
  return response.data;
};

export {
  getVideosByOrderId,
  getVideoTypes,
  addComments,
  getComments,
  getLikes,
  addLike,
};
