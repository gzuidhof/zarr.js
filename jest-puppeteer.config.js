module.exports = {
    launch: {
        headless: true,
    },
    server: {
        command: 'node fixtures-server.js',
        port: 7357,
        debug: true,
    },
};