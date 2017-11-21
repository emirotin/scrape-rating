const teams = require("./teams");
const { DbManager } = require("./db");

const TEAMS_LIMIT = 3000;

exports.run = () => {
  const db = DbManager();
  teams
    .fetch(TEAMS_LIMIT)
    .then(teams => {
      return db.run(() => db.upsertTeams(teams));
    })
    .then(() => console.log("OK"));
};
