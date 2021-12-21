const tmi = require("tmi.js");

// Saved users and votes
let users = {};
let votes = {};
let voteOngoing = false;

const options = {
  options: {
    debug: true,
  },
  connection: {
    cluster: "aws",
    reconnect: true,
  },
  identity: {
    username: "bot_or_your_username",
    password: "bot_or_your_oauth_token", // Log in with bot acc https://twitchapps.com/tmi/
  },
  channels: ["zedespook"],
};

const client = new tmi.client(options);

client.connect();

client.on("connected", (address, port) => {
  client.action("zedespook", "My bot :)");
});

client.on("chat", (channel, user, message, self) => {
  // Ignore messages from other bots
  if (self) {
    return;
  }

  // Get the first word of the message as the command
  const command = message.trim().split(" ")[0];

  // Handle bot commands
  if (command === "!vote") {
    // If vote is not ongoing, return
    if (!voteOngoing) {
      client.action("zedespook", "No vote is ongoing!");
      return;
    }

    // Prevent duplicate votes
    if (users[user["user-id"]]) {
      client.action("zedespook", `${user["display-name"]} has already voted!`);
      return;
    }

    // Grab vote number from message with split
    const vote = message.split(" ")[1];
    if (vote) {
      if (vote > 0 && vote < 9) {
        // Add vote to votes
        votes[vote] = votes[vote] + 1 || 1;

        client.action("zedespook", `${user["display-name"]} voted: ${vote}`);

        // Save user id to prevent duplicate votes
        users[user["user-id"]] = true;

        // After the first vote, start the timer to show results
        if (Object.keys(users).length === 1) {
          setTimeout(showResults, 20000);
        }
        // If 3 people voted start a 10 second timer to show results
      } else if (Object.keys(users).length === 3) {
        setTimeout(showResults, 10000);
      }
    }

    // Start a new vote
  } else if (command === "!startvote") {
    // If vote is ongoing, return
    if (voteOngoing) {
      client.action("zedespook", "A vote is already ongoing!");
      return;
    }

    // Reset votes and users
    resetVotes();

    // Set vote to ongoing
    voteOngoing = true;

    // Show message to chat
    client.action("zedespook", "A vote is now ongoing!");

    // Start the timer to show results
    setTimeout(showResults, 20000);

    // Stop the current vote
  } else if (command === "!stopvote") {
    // If vote is not ongoing, return
    if (!voteOngoing) {
      client.action("zedespook", "No vote is ongoing!");
      return;
    }

    // Show results
    showResults();

    // Stop the current vote
    voteOngoing = false;

    // Show message to chat
    client.action("zedespook", "The current vote has ended!");

    // Reset votes and users
    resetVotes();
  }
});

// Function to show results of the hihgest vote option
function showResults() {
  // If vote is not ongoing, return
  if (!voteOngoing) {
    return;
  }

  // Show the highest voted option and show votes for each option
  let highestVote = 0;
  let highestVoteOption = 0;
  for (let i = 1; i < 9; i++) {
    if (votes[i] > highestVote) {
      highestVote = votes[i];
      highestVoteOption = i;
    }
  }

  // Show all the votes to chat and remove curly brackets and separate with | for readability
  client.action(
    "zedespook",
    `The highest voted option is: ${highestVoteOption}. The votes are: ${JSON.stringify(
      votes
    )
      .replace(/[{}]/g, "")
      .replace(/,/g, " | ")}`
  );

  // Reset votes and users
  resetVotes();
}

// Function to reset votes and users
function resetVotes() {
  users = {};
  votes = {};
  voteOngoing = false;
}
