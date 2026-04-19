import API from './axios';

// ===== PO Bank =====
export const getPOBank = (department) => API.get(`/po-bank?department=${department}`);
export const upsertPOBank = (data) => API.put('/po-bank', data);
export const addPO = (data) => API.post('/po-bank/add', data);
export const removePO = (data) => API.post('/po-bank/remove', data);

// ===== Feedback Forms =====
export const createFeedbackForm = (data) => API.post('/feedback-forms', data);
export const updateFeedbackForm = (formId, data) => API.put(`/feedback-forms/${formId}`, data);
export const getFeedbackFormByEvent = (eventId) => API.get(`/feedback-forms/event/${eventId}`);
export const getFeedbackFormById = (formId) => API.get(`/feedback-forms/${formId}`);
export const deleteFeedbackForm = (formId) => API.delete(`/feedback-forms/${formId}`);

// ===== Feedback Submission =====
export const submitStudentFeedback = (data) => API.post('/feedback/student', data);
export const getFeedbackAnalytics = (eventId) => API.get(`/feedback/analytics/${eventId}`);
export const canGiveFeedback = (eventId) => API.get(`/feedback/can-submit/${eventId}`);

// ===== Expert =====
export const generateExpertCredentials = (data) => API.post('/expert/generate', data);
export const getEventExperts = (eventId) => API.get(`/expert/event/${eventId}`);

// ===== Events =====
export const getMyEvents = () => API.get('/events/user/my-events');
export const updateEvent = (id, data) => API.put(`/events/${id}`, data);
export const addEventManager = (eventId, userId) => API.post(`/events/${eventId}/managers`, { userId });
export const removeEventManager = (eventId, userId) => API.delete(`/events/${eventId}/managers`, { data: { userId } });

// ===== Admin =====
export const getAdminStats = () => API.get('/admin/stats');
export const getAdminUsers = () => API.get('/admin/users');
export const getAdminEvents = () => API.get('/admin/events');

// ===== Settings =====
export const getSettings = (department) => API.get(`/settings?department=${department}`);
export const updateSettings = (data) => API.put('/settings', data);

// ===== Auth =====
export const getMe = () => API.get('/auth/me');
