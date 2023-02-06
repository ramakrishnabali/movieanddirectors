const express = require("express");
const app = express();
const { open } = require("sqlite");

let database = null;

const path = require("path");
const dbPath = path.join(__dirname, "moviesData.db");
const sqlite3 = require("sqlite3");

app.use(express.json());

const connectDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running....");
    });
  } catch (error) {
    console.log(`database error ${error.message}`);
    process.exit(1);
  }
};

connectDbAndServer();

const convertSnakeCaseToCamelCase = (object) => {
  return {
    movieName: object.movie_name,
  };
};

//get movies list
app.get("/movies/", async (request, response) => {
  const sqlQuery = `SELECT * FROM movie;`;
  const dbResponse = await database.all(sqlQuery);
  const movieArray = dbResponse.map((eachMovie) =>
    convertSnakeCaseToCamelCase(eachMovie)
  );
  response.send(movieArray);
});

const convertToCamelCase = (each) => {
  return {
    movieId: each.movie_id,
    directorId: each.director_id,
    movieName: each.movie_name,
    leadActor: each.lead_actor,
  };
};
//get A movie
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const query = ` 
  SELECT 
    * 
  FROM 
    movie
  WHERE 
    movie_id = ${movieId};`;
  const movieResponse = await database.get(query);
  response.send(convertToCamelCase(movieResponse));
});

//post a movie

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const postQuery = `
    INSERT INTO 
        movie (director_id,movie_name,lead_actor)
    VALUES
        ( ${directorId},"${movieName}","${leadActor}");`;
  const databaseResponse = await database.run(postQuery);
  response.send("Movie Successfully Added");
});

//update movie
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateQuery = `
    UPDATE movie 
    SET
    director_id = ${directorId},
    movie_name = "${movieName}",
    lead_actor = "${leadActor}"
    WHERE 
        movie_id = ${movieId};`;
  await database.run(updateQuery);
  response.send("Movie Details Updated");
});

//delete a movie from movie table
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `
    DELETE  FROM movie 
    WHERE 
        movie_id = ${movieId};`;
  database.run(deleteQuery);
  response.send("Movie Removed");
});

const directorsCamelCase = (data) => {
  return {
    directorID: data.director_id,
    directorName: data.director_name,
  };
};
//get directors from director table
app.get("/directors/", async (request, response) => {
  const directorsQuery = `
    SELECT * FROM director;`;
  const directorsResponse = await database.all(directorsQuery);
  response.send(directorsResponse.map((each) => directorsCamelCase(each)));
});

//combine tables
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const combineQuery = `
    SELECT * FROM movie
    WHERE director_id = ${directorId};`;
  const combineResponse = await database.all(combineQuery);
  response.send(
    combineResponse.map((each) => convertSnakeCaseToCamelCase(each))
  );
});
module.exports = app;
