const { Op } = require("sequelize");
const { sequelize } = require("../model");

const getBestProfession = async (req, res) => {
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
};

const getBestClients = async (req, res) => {
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
};

module.exports = {
  getBestProfession,
  getBestClients
}
