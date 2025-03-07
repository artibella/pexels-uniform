import "../styles/globals.css";

import { MeshApp, useMeshLocation } from "@uniformdev/mesh-sdk-react";
import type { AppProps } from "next/app";
import { IconsProvider } from "@uniformdev/design-system";
import { useEffect } from "react";
import { initializeClient } from "../lib/pexels";
import { IntegrationSettings } from "../lib/types";

// Pexels Client initialization wrapper component
function ClientInitializer() {
  const { metadata } = useMeshLocation();

  useEffect(() => {
    // Initialize the client when the app starts and metadata is available
    const settings = metadata.settings as IntegrationSettings | undefined;
    if (settings?.apiKey) {
      console.log("Initializing Pexels client at app startup");
      initializeClient(settings.apiKey);
    }
  }, [metadata.settings]);

  return null;
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // The <MeshApp> component must wrap the entire app to provide Uniform Mesh SDK services
    <MeshApp>
      <IconsProvider>
        <ClientInitializer />
        <Component {...pageProps} />
      </IconsProvider>
    </MeshApp>
  );
}

export default MyApp;
