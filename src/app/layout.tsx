// Root layout - used only for non-locale routes
// The main layout is in [locale]/layout.tsx

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
