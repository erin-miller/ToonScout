module.exports = {
  apps: [
    {
      name: "ToonScout",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: process.env.NODE_ENV || "production",
        PORT: process.env.PORT || 5000,
      },
    },
  ],
};
