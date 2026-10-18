import type { Metadata } from "next";
import { Vista } from "./Vista";

export const metadata: Metadata = {
  title: { absolute: "Acceso administrativo | QBusiness Media" },
};

export default function Page() {
  return <Vista />;
}
