// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("Error Is : ", err);
    });
    app.listen(process.env.PORT, () => {
      console.log(`App is listen at Port : ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => console.log("MONGO db connection error !!!! ", err));

// Simple Approch
// import express from "express";

// const app = express()(async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${Db_Name}`);
//     app.on("error", (error) => {
//       console.log("Error Is : ", error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`Your app is running at port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("Error Is : ", error);
//     throw error;
//   }
// })();
