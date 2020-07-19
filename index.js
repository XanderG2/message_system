process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const pg = require("pg");
const PORT = process.env.PORT || 1025;

let counter = 0;
//const messages = [];

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = express();

const HTML_ENTITY_LOOKUP = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
};

function htmlentities(text) {
  return String(text).replace(/[<>&"]/g, (char) => HTML_ENTITY_LOOKUP[char]);
}

const handleErrors = (cb) => async (req, res, next) => {
  try {
    return await cb(req, res, next);
  } catch (e) {
    console.error(e);
    next(e);
    return;
  }
};

app.use(bodyParser.urlencoded());

app.get(
  "/debug",
  handleErrors(async (request, response, next) => {
    const data = await db.query("SELECT * FROM users");
    console.dir(data.rows);
    response.json(data.rows);
  })
);

app.post(
  "/",
  handleErrors(async (request, response) => {
    const userId = parseInt(request.query.user_id, 10);
    if (!userId) {
      throw new Error("You're not allowed to post messages, sorry");
    }
    console.log(request.body);
    await db.query("insert into messages (text, user_id) values ($1,$2)", [
      request.body.message,
      userId,
    ]);

    response.setHeader("Location", `/?user_id=${userId}`);
    response.statusCode = 301;
    response.end();
  })
);
app.get(
  "/",
  handleErrors(async (request, response) => {
    counter++;
    let messages;
    const data = await db.query(
      "SELECT messages.*, users.username FROM messages inner join users on(users.id=messages.user_id)"
    );
    console.dir(data.rows);
    messages = data.rows;
    response.setHeader("Content-Type", "text/html");
    response.end(`
<!DOCTYPE html>
<html>
<head>
<title>Demo server</title>
</head>
<body>
Request counter: ${counter}<br />
<h1>Messages</h1>
<ul>
  ${messages
    .map(
      (msg) =>
        `<li>${htmlentities(msg.username)}: ${htmlentities(msg.text)}</li>`
    )
    .join("\n  ")}
</ul>

<form method="POST">
<h3>Add message</h3>
  <textarea name="message"></textarea><br />
  <button type="submit">Send</button>
</form>
</body>
</html>
  `);
  })
);

app.use((request, response) => {
  response.statusCode = 404;
  response.end("File Not Found");
});

app.listen(PORT);
console.log(`Server running at http://localhost:${PORT}/`);
