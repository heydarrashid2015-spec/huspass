const config = {
  appId: "dk.huspass.app",
  appName: "HusPass",
  webDir: "out",
  server: {
    url: "https://www.huspass.dk",
    cleartext: false,
    allowNavigation: ["huspass.dk", "www.huspass.dk"]
  }
};

export default config;
