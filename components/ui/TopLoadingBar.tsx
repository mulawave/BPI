import React from "react";

export const TopLoadingBar: React.FC<{ loading: boolean }>= ({ loading }) => (
  <div
    className={`fixed top-0 left-0 w-full h-1 z-[100] transition-all duration-300 ${loading ? 'bg-green-600 opacity-100' : 'opacity-0'}`}
    style={{ boxShadow: loading ? '0 2px 8px 0 rgba(0,0,0,0.08)' : undefined }}
  />
);
