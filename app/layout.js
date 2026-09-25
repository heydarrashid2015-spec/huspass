import "./globals.css";
import PwaRegister from "./pwa-register";

export const metadata={
  metadataBase:new URL("https://huspass.dk"),
  title:{default:"HusPass",template:"%s · HusPass"},
  description:"Hold styr på boligoplysninger, vedligeholdelse, udgifter og dokumenter ét sted.",
  applicationName:"HusPass",
  icons:{icon:[{url:"/huspass-icon.svg",type:"image/svg+xml"}],apple:"/huspass-icon.svg"},
  manifest:"/manifest.webmanifest",
  appleWebApp:{capable:true,title:"HusPass",statusBarStyle:"default"},
  formatDetection:{telephone:false},
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
  return <html lang="da"><body><PwaRegister/>{children}</body></html>
}
