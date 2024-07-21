import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Cookie Parser:
// The cookie-parser middleware is a useful tool for parsing cookies in Express.js applications. It simplifies the process of accessing and managing cookies by populating the req.cookies object with the parsed cookie values, making it easier to work with cookies in your request handlers.

// CORS
// CORS (Cross Origin Resourse Sharing) is a critical concept for web security, enabling safe and controlled access to resources across different origins. By configuring CORS headers on the server, you can specify which domains are allowed to access your resources, what methods and headers can be used, and whether credentials can be included in the requests.

const app = express();

// We can use middle wares and configurations everytime using app.use
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// Data limit come from form
app.use(express.json({ limit: "16kb" }));
// Data limit come from url
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// To store images
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";

// routes declarations
app.use("/api/v1/users", userRouter);
export { app };
