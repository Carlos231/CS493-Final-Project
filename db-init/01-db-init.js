db.createUser({
  user: "tarpaulin",
  pwd: "hunter2",
  roles: [
    {
      role: "readWrite",
      db: "tarpaulin"
    }
  ]
});

db.assignments.insertMany([
  {
    "courseId": "123",
    "title": "Assignment 1",
    "points": "54",
    "due": "2019-06-7T17:00:00-07:00"
  },
  {
    "courseId": "342",
    "title": "Assignment 3",
    "points": "100",
    "due": "2019-06-14T9:00:00-07:00"
  },
  {
    "courseId": "123",
    "title": "Assignment 1",
    "points": "99",
    "due": "2019-05-14T02:00:00-07:00"
  },
  {
    "courseId": "532",
    "title": "Assignment 2",
    "points": "49",
    "due": "2019-06-11T17:00:00-07:00"
  },
  {
    "courseId": "345",
    "title": "Assignment 5",
    "points": "76",
    "due": "2019-06-10T17:00:00-07:00"
  },
  {
    "courseId": "654",
    "title": "Assignment 2",
    "points": "87",
    "due": "2019-07-09T17:00:00-07:00"
  }
]);

db.submissions.insertMany([
  {
    "assignmentId": "123",
    "studentId": "Assignment 1",
    "timestamp": "2019-06-7T17:00:00-07:00",
    "file": "link",
  }
]);


db.users.insertMany([
  {
    "_id": new ObjectId("54edb381a13ec9142b9bb953"),
    "name": "Sean",
    "email": "gillens@oregonstate.edu",
    "password": "hunter2",
    "role": "admin"
  },
  {
    "name": "Rob Hess",
    "email": "hessro@oregonstate.edu",
    "password": "hunter2",
    "role": "instructor"
  },
  {
    "name": "Jane Doe",
    "email": "doej@oregonstate.edu",
    "password": "hunter2",
    "role": "student"
  }
]);
db.courses.insertMany([
  {
    "_id": new ObjectId("54edb381a13ec9142b9bb853"),
    "subject": "CS",
    "number": 493,
    "title": "Cloud app devel",
    "term": "sp20",
    "instructorId": 0
  }
]);
db.users_courses.insertMany([
  {
    "studentId": "54edb381a13ec9142b9bb953",
    "courseId": "54edb381a13ec9142b9bb853"
  },
  {
    "studentId": "studentasd",
    "courseId": "courseasdf"
  }
]);
