import React from "react";

// Shown when the deployment is opened directly instead of inside Uniform
export default function Home() {
  return (
    <main className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Pexels for Uniform</h1>
      <p>
        This app is a Uniform Mesh integration. It runs inside the Uniform
        dashboard, where it adds Pexels photos and videos to the asset library
        and asset parameters.
      </p>
      <p>
        See the{" "}
        <a
          className="underline"
          href="https://github.com/artibella/pexels-uniform"
          target="_blank"
          rel="noopener noreferrer"
        >
          README
        </a>{" "}
        for how to register and install it.
      </p>
    </main>
  );
}
