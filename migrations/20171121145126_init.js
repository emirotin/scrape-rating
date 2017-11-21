exports.up = (knex, Promise) =>
  knex.schema
    .createTable("teams", table => {
      table.increments("id");
      table.integer("ratingId");
      table.string("name");
    })
    .createTable("releases", table => {
      table.increments("id");
      table.integer("ratingId");
      table.date("date");
    })
    .createTable("positions", table => {
      table.increments("sid");
      table.integer("team").references("teams.id");
      table.integer("release").references("releases.id");
      table.integer("position");
    });

exports.down = (knex, Promise) =>
  knex.schema
    .dropTable("positions")
    .dropTable("releases")
    .dropTable("teams");
