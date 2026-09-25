import "./globals.css";
import PwaRegister from "./pwa-register";

export const metadata={
  metadataBase:new URL("https://huspass.dk"),
  title:{default:"HusPass – Boligapp til boligejere i Danmark",template:"%s · HusPass"},
  description:"HusPass er en dansk boligapp, der samler boligoplysninger, vedligeholdelse, udgifter og dokumenter ét sted.",
  applicationName:"HusPass",
  icons:{icon:[{url:"/icon",type:"image/png",sizes:"512x512"}],apple:[{url:"/apple-icon",type:"image/png",sizes:"180x180"}]},
  manifest:"/manifest.webmanifest",
  appleWebApp:{capable:true,title:"HusPass",statusBarStyle:"black-translucent"},
  formatDetection:{telephone:false},
  robots:{index:true,follow:true},
  openGraph:{
    title:"HusPass – Boligapp til boligejere i Danmark",
    description:"Dansk boligapp til boligoplysninger, vedligeholdelse, udgifter og dokumenter.",
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
