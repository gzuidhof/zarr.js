const express = require("express");
const serveStatic = require("serve-static")
const path = require("path");

const fixturesFolderPath = path.normalize(__dirname + "/fixtures")
const serve = serveStatic(fixturesFolderPath, { dotfiles: "allow" });
const app = express();
app.use(serve);

const server = app.listen(7357, () => {
    console.log(`Server running on 7357, serving from ${fixturesFolderPath}`);
});
