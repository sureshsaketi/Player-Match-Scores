const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let db = null;

const initializationDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializationDbAndServer();
const nameNotation = (playerObject) => {
  return {
    playerId: playerObject.player_id,
    playerName: playerObject.player_name,
  };
};

//API 1 GET METHOD Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT * FROM player_details
    ;`;
  const allPlayersArray = await db.all(getAllPlayersQuery);
  response.send(
    allPlayersArray.map((eachPlayer) => {
      return nameNotation(eachPlayer);
    })
  );
});
// API 2 GET METHOD Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId}
    ;`;
  const player = await db.get(getPlayerQuery);
  response.send(nameNotation(player));
});

// API 3 PUT METHOD Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const updatePlayerQuery = `
    UPDATE player_details 
    SET 
    player_name = '${playerName}'
    WHERE player_id = ${playerId}
    ;`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// API 4 GET METHOD Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId}
    ;`;
  const matchDetails = await db.get(getMatchQuery);
  response.send({
    matchId: matchDetails["match_id"],
    match: matchDetails["match"],
    year: matchDetails["year"],
  });
});

//API 5 Returns a list of all the matches of a player
const playerMatchDetailsConvertCamelCaseToPascal = (matchObject) => {
  return {
    matchId: matchObject.match_id,
    match: matchObject.match,
    year: matchObject.year,
  };
};
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
SELECT match_id, match, year FROM match_details NATURAL JOIN player_match_score
GROUP BY player_match_score.player_id
;`;
  let playerMatchDetails = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatchDetails.map((eachPlayerMatchDetails) => {
      return playerMatchDetailsConvertCamelCaseToPascal(eachPlayerMatchDetails);
    })
  );
});

//API 6 GET METHOD Returns a list of players of a specific match
const convertCaseNotationOfPlayer = (playerObject) => {
  return {
    playerId: playerObject.player_id,
    playerName: playerObject.player_name,
  };
};
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  let matchPlayers = await db.all(getMatchPlayersQuery);
  response.send(matchPlayers);
});

// API 7 GET METHOD Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScore = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details NATURAL JOIN player_match_score 
    WHERE player_match_score.player_id = ${playerId} 
    GROUP BY player_match_score.player_id
    ;
    `;
  let playerScoreDetails = await db.get(getPlayerScore);
  response.send(playerScoreDetails);
  console.log(playerScoreDetails);
});
module.exports = app;
