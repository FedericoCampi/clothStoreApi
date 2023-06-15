module.exports = ({ env }) => ({
  proxy: true,
  url: env.int('PORT', 1337), // Sets the public URL of the application.
  app: {
    keys: env.array('APP_KEYS')
  },
});
