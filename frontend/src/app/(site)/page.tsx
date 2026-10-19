import type { Metadata } from "next";
import { Vista } from "./Vista";

export const metadata: Metadata = {
  title: { absolute: "QBusiness Media | Ideas claras, crecimiento real" },
};

export default function Page() {
  return <Vista />;
}
