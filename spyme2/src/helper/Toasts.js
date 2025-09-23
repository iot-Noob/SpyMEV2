// utils/toastHelper.js
import { toast } from "react-toastify";

const defaultOptions = {
  position: "top-right",
  autoClose: 3000,
};

export const showToast = {
  success: (msg, options = {}) =>
    toast.success(msg, { ...defaultOptions, ...options }),

  error: (err, options = {}) => {
    if (!err) return;

    // If it's an array of errors
    if (Array.isArray(err)) {
      err.forEach((e) =>
        toast.error(e, { ...defaultOptions, ...options })
      );
      return;
    }

    // If it's an object with "message" or "errors"
    if (typeof err === "object") {
      if (err.message) {
        toast.error(err.message, { ...defaultOptions, ...options });
      }
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach((e) =>
          toast.error(e, { ...defaultOptions, ...options })
        );
      }
      return;
    }

    // Otherwise assume it's just a string
    toast.error(String(err), { ...defaultOptions, ...options });
  },

  info: (msg, options = {}) =>
    toast.info(msg, { ...defaultOptions, ...options }),

  warn: (msg, options = {}) =>
    toast.warn(msg, { ...defaultOptions, ...options }),
};
