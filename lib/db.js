const Promise = require("bluebird");
const knex = require("knex");
const parseInt = require("lodash/parseInt");

const knexConfig = require("../knexfile");

const getTable = ({ db, trx, tableName }) => {
  const t = db(tableName);
  if (trx) {
    return t.transacting(trx);
  }
  return t;
};

const findKey = ({ db, trx, tableName, whereFields, keyField = "id" }) =>
  getTable({
    db,
    trx,
    tableName
  })
    .select(keyField)
    .where(whereFields)
    .get(0)
    .then(record => (record ? record[keyField] : null));

const upsert = ({
  db,
  trx,
  tableName,
  whereFields,
  dataFields,
  keyField = "id"
}) =>
  findKey({
    db,
    trx,
    tableName,
    whereFields,
    keyField
  }).then(key =>
    insertOrUpdate({
      db,
      trx,
      tableName,
      extraInsertFields: whereFields,
      updateFields: dataFields,
      key,
      keyField
    })
  );

const insertOrUpdate = ({
  db,
  trx,
  tableName,
  updateFields,
  extraInsertFields,
  key,
  keyField = "id"
}) => {
  if (!key) {
    return getTable({
      db,
      trx,
      tableName
    })
      .insert(Object.assign({}, updateFields, extraInsertFields))
      .get(0);
  } else {
    return getTable({
      db,
      trx,
      tableName
    })
      .where(keyField, key)
      .update(updateFields)
      .thenReturn(key);
  }
};

const DbManager = () => {
  const db = knex(knexConfig);

  let currentTrx = null;

  const commit = () => {
    if (!currentTrx) {
      throw new Error("Transaction is not in progress!");
    }
    return currentTrx.commit();
  };

  const rollback = () => {
    if (!currentTrx) {
      throw new Error("Transaction is not in progress!");
    }
    return currentTrx.commit();
  };

  const run = fn => {
    if (currentTrx) {
      throw new Error("Transaction already in progress!");
    }
    return db.transaction(trx => {
      currentTrx = trx;
      return Promise.resolve(fn(trx))
        .then(commit)
        .catch(rollback);
    });
  };

  const upsertTeam = Promise.method(({ name, id }) => {
    const ratingId = parseInt(id);

    return upsert({
      db,
      trx: currentTrx,
      tableName: "teams",
      whereFields: {
        ratingId
      },
      dataFields: { name }
    }).catch(e => {
      console.error("Upsert team error:", e);
      throw e;
    });
  });

  const upsertTeams = teams => Promise.map(teams, upsertTeam);

  return {
    run,
    upsertTeams
  };
};

exports.DbManager = DbManager;
