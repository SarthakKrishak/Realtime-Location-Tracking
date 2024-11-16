const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const app = express();
const PORT = 3000;

const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")))

io.on("connection", function (socket) {

    socket.on("send-location", function (data) {
        io.emit("recieved-location", { id: socket.id,...data })
    })

    socket.on("disconnect", function () {
        io.emit("user-disconnected",socket.id)
    })
});


app.get("/", (req, res) => {
    res.render("index");
});


server.listen(PORT, () => console.log(`Server started at ${PORT}`));
