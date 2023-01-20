const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let database = null;

const initializeDBAnServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (error) {
    console.log(`Data Error:${error}`);
    process.exit(1);
  }
};
initializeDBAnServer();

const convertStateToDbObject = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};
//API1;

app.get("/states/", async (Request, Response) => {
  const getStatesListQuery = `SELECT * FROM state;`;
  const getStatesListQueryResponse = await database.all(getStatesListQuery);
  Response.send(
    getStatesListQueryResponse.map((eachItem) =>
      convertStateToDbObject(eachItem)
    )
  );
});

//API2;

app.get("/states/:stateId/", async (Request, Response) => {
  const { stateId } = Request.params;
  const getListByIdQuery = `SELECT * FROM state
    WHERE state_id = '${stateId}';`;
  const getListByIdQueryResponse = await database.get(getListByIdQuery);
  Response.send(convertStateToDbObject(getListByIdQueryResponse));
});

//API 3;

app.post("/districts/", async (Request, Response) => {
  const { districtName, stateId, cases, cured, active, deaths } = Request.body;
  const createDistrictQuery = `INSERT INTO
    district(district_name,state_id,cases,cured,active,deaths)
    VALUES(
        '${districtName}',${stateId},${cases},${cured},${active},${deaths}
    );`;
  const createDistrictQueryResponse = await database.run(createDistrictQuery);
  Response.send("District Successfully Added");
});

//API 4;

const convertDBObjectToAPI4 = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};

app.get("/districts/:districtId/", async (Request, Response) => {
  const { districtId } = Request.params;
  const getDistrictListDetails = `select * from district where district_id=${districtId};`;
  const getDistrictListDetailsResponse = await database.get(
    getDistrictListDetails
  );
  Response.send(convertDBObjectToAPI4(getDistrictListDetailsResponse));
});

//API 5;

app.delete("/districts/:districtId/", async (Request, Response) => {
  const { districtId } = Request.params;
  const deleteDistrict = `
    delete from district where district_id = ${districtId};`;
  const deleteFromDistrictResponse = await database.run(deleteDistrict);
  Response.send("District Removed");
});

//API6;

app.put("/districts/:districtId/", async (Request, Response) => {
  const { districtId } = Request.params;
  const { districtName, stateId, cases, cured, active, deaths } = Request.body;
  const updateDistrictDetails = `update district set
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths} where district_id = ${districtId};`;
  const updateDistrictDetailsResponse = await database.run(
    updateDistrictDetails
  );
  Response.send("District Details Updated");
});

//API7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIDStatsQuery = `select sum(cases) as totalCases, sum(cured) as totalCured,
    sum(active) as totalActive , sum(deaths) as totalDeaths from district where state_id = ${stateId};`;

  const getStateByIDStatsQueryResponse = await database.get(
    getStateByIDStatsQuery
  );
  response.send(getStateByIDStatsQueryResponse);
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `select state_id from district where district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);
  //console.log(typeof getDistrictIdQueryResponse.state_id);
  const getStateNameQuery = `select state_name as stateName from state where 
  state_id = ${getDistrictIdQueryResponse.state_id}`;
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
