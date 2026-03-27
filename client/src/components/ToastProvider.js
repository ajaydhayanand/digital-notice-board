import React from "react";
import { Toaster, toast } from "react-hot-toast";

export const ToastProvider = ({ children }) => (
  <>
    {children}
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#111827",
          color: "#f8fafc",
          border: "1px solid rgba(148, 163, 184, 0.18)",
        },
      }}
    />
  </>
);

export const useToast = () => ({
  addToast: ({ type = "success", message }) => {
    if (type === "error") toast.error(message);
    else toast.success(message);
  },
});
