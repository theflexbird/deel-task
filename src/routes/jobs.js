const { Op } = require("sequelize");
const { sequelize } = require("../model");

const getUnpaid = async (req, res) => {
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
};

const postPay = async (req, res) => {
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
};

module.exports = {
  getUnpaid,
  postPay
};
