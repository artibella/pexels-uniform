import React from "react";
import { Container } from "@uniformdev/design-system";
import { AssetLibrary } from "../components/AssetLibrary";

// Index page that displays the asset library
export default function Home() {
  return (
    <main>
      <Container>
        <AssetLibrary mode="library" />
      </Container>
    </main>
  );
}
