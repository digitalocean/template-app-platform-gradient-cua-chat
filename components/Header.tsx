import { metadata } from "@/app/layout";
import Image from "next/image";
import Link from "next/link";
import digitaloceanLogo from "@/public/digitalocean.svg";
import Navigation from "./Navigation";

export default function Header() {
  return (
    <header
      className="
        fixed top-0 left-0 right-0
        flex items-center justify-between
        px-6 py-4
        bg-gradient-to-r from-[#1a82fa] to-[#1464d2]
        shadow-md text-white z-50
      "
      style={{ height: "64px" }} /* Or use h-16 in Tailwind */
    >
      <Link href="/" className="flex items-center gap-6 no-underline">
        <Image
          src={digitaloceanLogo}
          alt="DigitalOcean"
          width={48}
          height={48}
          className="white-svg"
        />

        {metadata.title && (
          <span className="pl-2 text-white text-2xl">
            {String(metadata.title)}
          </span>
        )}
      </Link>

      <div className="flex items-center gap-4">
        <Navigation />
      </div>
    </header>
  );
}
