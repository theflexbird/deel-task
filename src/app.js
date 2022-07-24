const express = require("express");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");
const { getProfile } = require("./middleware/getProfile");
const app = express();
const { getContract, getAllContracts } = require("./routes/contracts");
const { getUnpaid, postPay } = require("./routes/jobs");
const { getBestProfession, getBestClients } = require("./routes/admin");
const { postDeposit } = require("./routes/balances");

app.use(bodyParser.json());
app.set("sequelize", sequelize);
app.set("models", sequelize.models);

app.get("/contracts/:id", getProfile, getContract);

app.get("/contracts", getProfile, getAllContracts);

app.get("/jobs/unpaid", getProfile, getUnpaid);

app.post("/jobs/:job_id/pay", getProfile, postPay);

app.post("/balances/deposit/:userId", getProfile, postDeposit);

app.get("/admin/best-profession", getBestProfession);

app.get("/admin/best-clients", getBestClients);

module.exports = app;
