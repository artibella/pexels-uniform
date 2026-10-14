import React from "react";
import Image from "next/image";
import { Heading } from "@uniformdev/design-system";

import { REFERRAL_QUERY_PARAMS } from "../lib/constants";

const PexelsLink = () => (
  <a
    href={`https://www.pexels.com?${REFERRAL_QUERY_PARAMS}`}
    target="_blank"
    rel="noopener noreferrer"
    className="underline"
  >
    Pexels
  </a>
);

export const AssetLibraryHeader = () => (
  <header className="flex items-top">
    <Image
      src="/pexels-app-icon.svg"
      alt=""
      className="block h-12 w-12 mr-3"
      width={48}
      height={48}
    />
    <Heading level={3} className="mb-0 leading-none">
      <div className="inline-block align-middle">Pexels</div>
      <div className="text-sm text-gray-600">
        Photos and videos provided by <PexelsLink />
      </div>
    </Heading>
  </header>
);

/** Compact attribution line for the asset parameter dialog */
export const PexelsAttribution = () => (
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <Image src="/pexels-app-icon.svg" alt="" width={16} height={16} />
    <span>
      Photos and videos provided by <PexelsLink />
    </span>
  </div>
);
