import Image from "next/image";
import { Version } from "@iblai/iblai-js/web-containers";
import { appVersion } from "@/lib/version";

const logo = (
  <Image
    src="/iblai-logo.png"
    alt="ibl.ai"
    width={43}
    height={19}
    className="h-4 w-auto mx-2 mb-1"
  />
);
export default function AppVersion() {
  return <Version appName="Skills" appVersion={appVersion} poweredBy={logo} />;
}
