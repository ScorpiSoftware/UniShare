import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniShare | Database Migrations",
  description: "Apply database migrations",
};

export default function MigrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
