import { AssetClient } from "@uniformdev/assets";
import { FileClient } from "@uniformdev/files";
import { uniformApiHost } from "./delegation";

/** Uniform clients that act as the author, using their delegated access token */
export function createUniformClients(accessToken: string, projectId: string) {
  const options = {
    apiHost: uniformApiHost(),
    bearerToken: accessToken,
    projectId,
    bypassCache: true,
  };
  return {
    fileClient: new FileClient(options),
    assetClient: new AssetClient(options),
  };
}
