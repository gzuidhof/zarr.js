const express = require("express");

module.exports = async () => {
    const app = express();
    app.use(express.static("fixtures", { dotfiles: 'allow' }));
    const server = app.listen(3000);
    global.__SERVER__ = server;
}