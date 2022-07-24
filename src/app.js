const express = require("express");
const bodyParser = require("body-parser");
const { Op, InvalidConnectionError } = require("sequelize");
const { sequelize } = require("./model");
const { getProfile } = require("./middleware/getProfile");
const app = express();
app.use(bodyParser.json());
app.set("sequelize", sequelize);
app.set("models", sequelize.models);

app.get("/contracts/:id", getProfile, async (req, res) => {
  const { profile } = req;
  const { Contract } = req.app.get("models");
  const { id } = req.params;
  const contract = await Contract.findOne({
    where: {
      id,
      [Op.or]: [{ ClientId: profile.id }, { ContractorId: profile.id }]
    }
  });
  if (!contract) return res.status(404).end();
  res.json(contract);
});

app.get("/contracts", getProfile, async (req, res) => {
  const { profile } = req;
  const { Contract } = req.app.get("models");
  const contracts = await Contract.findAll({
    where: {
      [Op.or]: [{ ClientId: profile.id }, { ContractorId: profile.id }],
      status: { [Op.not]: "terminated" }
    }
  });
  if (!contracts) return res.status(404).end();
  res.json(contracts);
});

app.get("/jobs/unpaid", getProfile, async (req, res) => {
  const { profile } = req;
  const { Job, Contract } = req.app.get("models");
  const jobs = await Job.findAll({
    where: {
      paid: { [Op.not]: true }
    },
    include: {
      attributes: [],
      model: Contract,
      where: {
        [Op.or]: [{ ClientId: profile.id }, { ContractorId: profile.id }]
      }
    }
  });
  if (!jobs) return res.status(404).end();
  res.json(jobs);
});

app.post("/jobs/:job_id/pay", getProfile, async (req, res) => {
  const { profile } = req;
  const { job_id } = req.params;
  const { Job, Contract, Profile } = req.app.get("models");
  const job = await Job.findOne({
    where: {
      paid: { [Op.not]: true },
      id: job_id
    },
    include: {
      model: Contract,
      where: { ClientId: profile.id },
      include: {
        model: Profile,
        as: "Contractor"
      }
    }
  });
  if (!job) return res.status(404).end();
  if (profile.balance < job.price) return res.status(403).end();

  const contractor = job.Contract.Contractor;

  const t = await sequelize.transaction();

  try {
    profile.balance = profile.balance - job.price;
    profile.save();

    contractor.balance = contractor.balance + job.price;
    contractor.save();

    job.paid = true;
    job.paymentDate = new Date();
    job.save();

    await t.commit();
  } catch (error) {
    await t.rollback();
    res.status(500).end();
  }
  res.json(job);
});

app.post("/balances/deposit/:userId", getProfile, async (req, res) => {
  const { profile } = req;
  const { userId } = req.params;
  const { deposit } = req.body;
  if (parseInt(userId) !== profile.id) return res.status(400).end();
  const { Job, Profile, Contract } = req.app.get("models");
  const totalAmount = await Job.findOne({
    attributes: [
      [sequelize.fn('COALESCE', sequelize.fn("sum", sequelize.col("price")), 0), "amount"],
    ],
    where: {
      paid: { [Op.not]: true },
    },
    raw: true,
    include: {
      attributes: [],
      model: Contract,
      where: {
        status: { [Op.not]: "terminated" }
      },
      include: {
        model: Profile,
        as: "Client",
        where: {
          id: userId
        }
      }
    }
  });
  const AllowedAmount = totalAmount.amount * 25 / 100;
  if (AllowedAmount < deposit) return res.status(403).end();
  // save to database
  profile.balance = profile.balance + deposit;
  profile.save();
  res.json(profile);
});

app.get("/admin/best-profession", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).end();
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate) || isNaN(endDate)) return res.status(400).end();
  const { Profile, Contract, Job } = req.app.get("models");
  const profile = await Profile.findOne({
    attributes: [
      "profession",
      [sequelize.fn("sum", sequelize.col("price")), "amount"]
    ],
    where: {
      type: "contractor"
    },
    subQuery: false,
    raw: true,
    include: {
      attributes: [],
      as: "Contractor",
      model: Contract,
      include: {
        attributes: [],
        model: Job,
        where: {
          paid: true,
          paymentDate: {
            [Op.between]: [startDate, endDate]
          }
        }
      }
    },
    group: ["profession"],
    order: [[sequelize.literal("amount"), "DESC"]]
  });
  if (!profile) return res.status(404).end();
  res.json(profile);
});

app.get("/admin/best-clients", async (req, res) => {
  const { start, end, limit = 2 } = req.query;
  if (!start || !end) return res.status(400).end();
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate) || isNaN(endDate)) return res.status(400).end();
  const { Profile, Contract, Job } = req.app.get("models");
  const profile = await Profile.findAll({
    attributes: [
      "id",
      [sequelize.literal("firstName || ' ' || lastName"), "fullName"],
      [sequelize.fn("sum", sequelize.col("price")), "paid"]
    ],
    where: {
      type: "client"
    },
    subQuery: false,
    raw: true,
    include: {
      attributes: [],
      as: "Client",
      model: Contract,
      include: {
        attributes: [],
        model: Job,
        where: {
          paid: true,
          paymentDate: {
            [Op.between]: [startDate, endDate]
          }
        }
      }
    },
    limit,
    group: ["fullName"],
    order: [[sequelize.literal("paid"), "DESC"]]
  });
  if (!profile) return res.status(404).end();
  res.json(profile);
});

module.exports = app;
