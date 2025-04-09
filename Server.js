// ✅ Load environment variables FIRST
const dotenv = require("dotenv");
dotenv.config();

// ✅ Import dependencies
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const app = require("./App");

// ✅ Apply middlewares BEFORE DB connection
app.use(
    cors({
        origin: ["http://localhost:5173", "https://mern-job-portal-client-two.vercel.app"], // frontend origins
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true, // allow cookies
    })
);

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(require("express").json());

// ✅ Connect to MongoDB
const DBConnectionHandler = require("./Utils/DBconnect");
DBConnectionHandler();

// ✅ Test route
app.get("/", (req, res) => {
    res.send("Job Hunter Server is running!");
});

// ✅ 404 Handler
app.use("*", (req, res) => {
    res.status(404).json({ message: "Not Found" });
});

// ✅ Error handler
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next("There was a problem");
    }
    res.status(err.status || 500).send(err.message || "Something went wrong");
});

// ✅ Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
