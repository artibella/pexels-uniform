import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heading, HorizontalRhythm } from "@uniformdev/design-system";

import { REFERRAL_QUERY_PARAMS } from "../lib/constants";

export const AssetLibraryHeader = ({}) => {
  return (
    <div>
      <div className="flex items-center">
        <header className="flex items-top">
          <Image
            src="/pexels-app-icon.svg"
            alt="Pexels logo"
            className="block h-12 w-12 mr-3"
            width={48}
            height={48}
          />

          <Heading level={3} className="mb-0 leading-none line-height-none">
            <div className="inline-block align-middle">Pexels</div>
            <div className="text-sm text-gray-600">
              <span>Search photos on </span>
              <a
                href={`https://pexels.com?${REFERRAL_QUERY_PARAMS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Pexels
              </a>
            </div>
          </Heading>
        </header>
      </div>
    </div>
  );
};

export default AssetLibraryHeader;
