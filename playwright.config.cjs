module.exports = {
  webServer: {
    command: "npm run serve -- --strictPort",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: true,
    timeout: 120000,
  },
};
