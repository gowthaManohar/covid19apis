const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

let dbpath = path.join(__dirname, "covid19India.db");
let db = null;
let initializationDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`db error ${e.message}`);
    process.exit(1);
  }
};

initializationDbAndServer();

let stateobject = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};

let districtobject = (district) => {
  return {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  };
};

let totaldetails = (object) => {
  return {
    totalCases: object.cases,
    totalCured: object.cured,
    totalActive: object.active,
    totalDeaths: object.deaths,
  };
};

// api1 get states
app.get("/states/", async (request, response) => {
  let query = `SELECT * FROM state`;
  let dbresponse = await db.all(query);
  response.send(dbresponse.map((sta) => stateobject(sta)));
});

// api2 get one

app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  let query = `SELECT * FROM state WHERE state_id = ${stateId}`;
  let dbresponse = await db.get(query);
  response.send(stateobject(dbresponse));
});

//let api 3 post district

app.post("/districts/", async (request, response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  let query = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
  VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  let dbresponse = await db.run(query);
  response.send("District Successfully Added");
});

//API 4 GET DISTRICT
app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let query = `SELECT * FROM district WHERE district_id = ${districtId}`;
  let dbresponse = await db.get(query);
  response.send(districtobject(dbresponse));
});

//api 5 remove district

app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let query = `DELETE FROM district WHERE district_id = ${districtId}`;
  let dbresponse = await db.run(query);
  response.send("District Removed");
});

// api 6 update district

app.put("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  let query = `UPDATE district SET
   district_name ='${districtName}',state_id = ${stateId},cases=${cases},
   cured=${cured},active = ${active},deaths=${deaths}
   WHERE 
   district_id = ${districtId};`;
  let dbresponse = await db.run(query);
  response.send("District Details Updated");
});

// api 7 get total details

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;
  let query = `SELECT 
  SUM(cases),SUM(cured),SUM(active),SUM(deaths)
  FROM district 
  WHERE state_id = ${stateId};`;

  let dbresponse = await db.get(query);
  console.log(dbresponse);
  response.send({
    totalCases: dbresponse["SUM(cases)"],
    totalCured: dbresponse["SUM(cured)"],
    totalActive: dbresponse["SUM(active)"],
    totalDeaths: dbresponse["SUM(deaths)"],
  });
});

//api 8 get state

app.get("/districts/:districtId/details/", async (request, response) => {
  let { districtId } = request.params;
  let query = `SELECT state_name FROM district NATURAL JOIN state 
  WHERE district_id = ${districtId};`;
  let dbresponse = await db.get(query);

  response.send({ stateName: dbresponse["state_name"] });
});

module.exports = app;
