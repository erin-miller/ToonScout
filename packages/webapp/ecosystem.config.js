module.exports = {
  apps: [
    {
      name: "ToonScout",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
