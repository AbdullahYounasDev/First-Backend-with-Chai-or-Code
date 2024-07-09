import mongoose from "mongoose";
import { Db_Name } from "../constants.js";

const connectDB = async () => {
  try {
    const ConnectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${Db_Name}`
    );
    console.log(
      "MongoDb Connected !! and Host at : ",
      ConnectionInstance.connection.host,
      "at PORT : ",
      process.env.PORT
    );
  } catch (error) {
    console.log("Mogongo DB Connection Error : ", error);
    process.exit(1);
  }
};

export default connectDB;
