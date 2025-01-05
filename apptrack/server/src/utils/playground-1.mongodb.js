// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use("test");

// Update the first entry
db.trainingemails.updateOne(
  { _id: ObjectId("6761ea0b9aeac2c4758a1908") },
  { $set: { company: "Amazon", position: "Software Engineer" } }
);

// Update the second entry
db.trainingemails.updateOne(
  { _id: ObjectId("6761ea0b9aeac2c4758a1911") },
  { $set: { company: "Snapchat", position: "Software Engineer, Android" } }
);

// Update the third entry
db.trainingemails.updateOne(
  { _id: ObjectId("6761ea0c9aeac2c4758a1923") },
  { $set: { company: "Allara", position: "Full-Stack Engineer (Product)" } }
);

// Update the fourth entry
db.trainingemails.updateOne(
  { _id: ObjectId("6761ea0d9aeac2c4758a193b") },
  { $set: { company: "Warner Bros. Discovery", position: "Software Engineering Intern" } }
);

// Update the fifth entry
db.trainingemails.updateOne(
  { _id: ObjectId("6761ea0e9aeac2c4758a1947") },
  { $set: { company: "Ally Financial Inc.", position: "Early Talent - Technology - Software Engineering / Software Development" } }
);

// Update the sixth entry
db.trainingemails.updateOne(
  { _id: ObjectId("6761ea0f9aeac2c4758a1953") },
  { $set: { company: "Rockstar Games", position: "ed your application for the Animation R&amp;D Programmer: Computer Vision and ML" }}
);

// Update the seventh entry
db.trainingemails.updateOne(
  { _id: ObjectId("6761ea069aeac2c4758a18ab") },
  { $set: { company: "Major League Baseball", position: "Associate Software Engineer" } }
);

// Update the eighth entry
db.trainingemails.updateOne(
  { _id: ObjectId("6761ea019aeac2c4758a1851") },
  { $set: { company: "DoorDash", position: "Software Engineer I, Entry-Level" } }
);

// Update the ninth entry
db.trainingemails.updateOne(
  { _id: ObjectId("6761ea0b9aeac2c4758a190e") },
  { $set: { company: "TikTok", position: "Software Development Engineer in Test Graduate" } }
);

// Update the tenth entry
db.trainingemails.updateOne(
  { _id: ObjectId("6761ea0e9aeac2c4758a194a") },
  { $set: { company: "FanDuel", position: "Software Engineer, Media" } }
);
