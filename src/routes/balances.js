const { Op } = require("sequelize");
const { sequelize } = require("../model");

const postDeposit = async (req, res) => {
  const { profile } = req;
  const { userId } = req.params;
  const { deposit } = req.body;
  if (parseInt(userId) !== profile.id) return res.status(401).end();
  if (!deposit || deposit < 1 ) return res.status(400).end();
  const { Job, Profile, Contract } = req.app.get("models");
  const totalAmount = await Job.findOne({
    attributes: [
      [
        sequelize.fn(
          "COALESCE",
          sequelize.fn("sum", sequelize.col("price")),
          0
        ),
        "amount"
      ]
    ],
    where: {
      paid: { [Op.not]: true }
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
  const AllowedAmount = (totalAmount.amount * 25) / 100;
  if (AllowedAmount < deposit) return res.status(403).end();
  // save to database
  profile.balance = profile.balance + deposit;
  profile.save();
  res.json(profile);
};

module.exports = {
  postDeposit
};
