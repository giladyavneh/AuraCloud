import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/statuses', (req, res) => {
  userId = req.query.userId;
  mongo.get(userId, (err, statuses) => {
    if (err) {
      res.status(500).send('Error retrieving statuses');
    } else {
      res.json(statuses); // 
//   name: "shoham",
//   "arn:aws:s3:::mybucket": {
//     getObject: { status: "green", reason: null , timestamp: "2024-06-01T12:00:00Z" },
//     putObject: { status: "red", reason: "policy mismatch", timestamp: "2024-06-01T12:00:00Z" }
//    },
//   "arn:aws:s3:::mybuckety": { status: "red", reason: "policy mismatch", timestamp: "2024-06-01T12:00:00Z" },
//   "arn:aws:s3:::mybucketu": { status: "yellow", reason: "connect to vpn", timestamp: "2024-06-01T12:00:00Z" },
// }
//     }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});