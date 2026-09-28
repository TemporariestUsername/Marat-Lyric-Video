import React, { createContext, useContext } from "react";

// Absolute song time in seconds. Scenes read this instead of useCurrentFrame()
// so preview compositions (which start mid-song) and frozen snapshots (the
// chorus page-shatter re-renders the previous scene at a fixed time) just work.
const TimeCtx = createContext(0);
export const useT = () => useContext(TimeCtx);
export const TimeProvider: React.FC<{ t: number; children: React.ReactNode }> = ({ t, children }) => (
  <TimeCtx.Provider value={t}>{children}</TimeCtx.Provider>
);
