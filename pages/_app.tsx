import "../styles/globals.css";

import { MeshApp } from "@uniformdev/mesh-sdk-react";
import type { AppProps } from "next/app";

// Pages that render outside the Uniform dashboard iframe
const STANDALONE_PAGES = ["/"];

function MyApp({ Component, pageProps, router }: AppProps) {
  if (STANDALONE_PAGES.includes(router.pathname)) {
    return <Component {...pageProps} />;
  }

  return (
    // The <MeshApp> component must wrap every location page to provide Uniform Mesh SDK services
    <MeshApp>
      <Component {...pageProps} />
    </MeshApp>
  );
}

export default MyApp;
