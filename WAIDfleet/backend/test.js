const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Driver = require("./models/driverModel");

connectDB();

const test = async () => {
  const driver = await Driver.create({
    name: "Test Driver",
    phone: "1234567890",
  });
  console.log(driver);
  process.exit();
};

test();