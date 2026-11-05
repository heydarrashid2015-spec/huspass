const config = {
  appId: "dk.huspass.app",
  appName: "HusPass",
  webDir: "out",
  plugins: {
    StatusBar: {
      backgroundColor: "#008F5A",
      style: "LIGHT",
      overlaysWebView: false
    }
  },
  server: {
    url: "https://www.huspass.dk",
    cleartext: false,
    allowNavigation: ["huspass.dk", "www.huspass.dk"]
  }
};

export default config;
