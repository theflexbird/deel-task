const { Op } = require("sequelize");

const getContract = async (req, res) => {
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
};

const getAllContracts = async (req, res) => {
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
};

module.exports = {
  getContract,
  getAllContracts
};
