import type { Metadata } from "next";
import { Vista } from "./Vista";

export const metadata: Metadata = {
  title: { absolute: "Reseñas | QBusiness Media" },
};

export default function Page() {
  return <Vista />;
}
