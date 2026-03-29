import "./globals.css";

export const metadata = {
  title: "The Black Entrepreneurship Society | Built for Black Founders",
  description:
    "A private community for Black founders with tools, templates, courses, and support to launch, grow, and scale businesses the right way.",
  openGraph: {
    title: "The Black Entrepreneurship Society",
    description:
      "Real tools, strategies, and connections for Black founders to win in business.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
