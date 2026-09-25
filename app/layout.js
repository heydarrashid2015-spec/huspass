import "./globals.css";

export const metadata={
  metadataBase:new URL("https://huspass.dk"),
  title:{default:"HusPass",template:"%s · HusPass"},
  description:"Hold styr på boligoplysninger, vedligeholdelse, udgifter og dokumenter ét sted.",
  applicationName:"HusPass",
  robots:{index:true,follow:true},
  openGraph:{
    title:"HusPass",
    description:"Dit hjem. Altid samlet.",
    type:"website",
    locale:"da_DK",
    siteName:"HusPass"
  }
};

export const viewport={
  width:"device-width",
  initialScale:1,
  viewportFit:"cover",
  themeColor:"#f7faf8"
};

export default function RootLayout({children}){
  return <html lang="da"><body>{children}</body></html>
}
