"use client";

import { useEffect, useState } from "react";

export default function AlertBanner({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFlash(true);
    const id = setInterval(() => setFlash((f) => !f), 500);
    const timeout = setTimeout(() => {
      clearInterval(id);
      setFlash(false);
    }, 6000);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [visible, message]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium transition-colors duration-200 ${
        flash
          ? "bg-red-600 text-white"
          : "bg-red-800 text-red-200"
      }`}
    >
      {message}
    </div>
  );
}
