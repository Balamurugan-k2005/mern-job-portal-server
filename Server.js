const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const app = require("./App");

// ✅ Enable CORS before any routes
app.use(
    cors({
        origin: "http://localhost:5173", // your frontend origin
        credentials: true, // allow cookies to be sent
    })
);

// DB Connection
const DBConnectionHandler = require("./Utils/DBconnect");
DBConnectionHandler();

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Job Hunter Server is running!");
});

// 404 Error handler
app.use("*", (req, res) => {
    res.status(404).json({ message: "Not Found" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    if (res.headersSent) {
        next("There was a problem");
    } else {
        if (err.message) {
            res.status(err.status || 500).send(err.message);
        } else {
            res.status(500).send("Something went wrong");
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
