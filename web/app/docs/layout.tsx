import { Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageMap = await getPageMap();

  return (
    <Layout
      pageMap={pageMap}
      navbar={
        <Navbar
          logo={
            <span style={{ fontWeight: 700, letterSpacing: "-0.04em" }}>
              ANAS <span style={{ color: "#D97757" }}>CLI</span>
            </span>
          }
        />
      }
    >
      {children}
    </Layout>
  );
}