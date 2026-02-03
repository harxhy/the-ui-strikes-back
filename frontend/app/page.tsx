import React from "react";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#f9fafb",
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          marginBottom: "1rem",
        }}
      >
        UI Copilot Demo
      </h1>
      <p
        style={{
          fontSize: "1.15rem",
          color: "#555",
          textAlign: "center",
          maxWidth: "24rem",
        }}
      >
        This is a hackathon demo for &quot;UI Copilot – Backend to UI&quot;.<br />
        <br />
        <strong>Generated UI components will appear here.</strong>
      </p>
    </main>
  );
}