// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require("express");

const app = express();
app.use(express.static("fixtures", { dotfiles: 'allow' }));
const server = app.listen(3000);

module.exports = async () => {
    global.__SERVER__ = server;
};