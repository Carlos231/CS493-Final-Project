/*
 * Review schema and data accessor methods.
 */

const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

// TODO 1/3: uncomment when /user is in
/*
const {
  getUserById
} = require('../models/user');
*/

const EnrollmentSchema = {
  add: { required: true},
  remove: { required: true}
};
exports.EnrollmentSchema = EnrollmentSchema;

async function enrollStudentInCourse(studentId, courseId) {
  const db = getDBReference();
  const collection = db.collection('users_courses');
  // create enrollment or update to same values if already exists
  const result = await collection.replaceOne(
    filter={
      studentId: studentId,
      courseId: courseId
    },
    replacement={
      studentId: studentId,
      courseId: courseId
    },
    { upsert: true }
  );
  return result.matchedCount;
}
exports.enrollStudentInCourse = enrollStudentInCourse;

async function removeStudentFromCourse(studentId, courseId) {
  const db = getDBReference();
  const collection = db.collection('users_courses');
  // remove enrollment if exists
  const result = await collection.deleteOne(
    filter={
      studentId: studentId,
      courseId: courseId
    }
  );
  return result.deletedCount > 0;
}
exports.removeStudentFromCourse = removeStudentFromCourse;

async function updateCourseEnrollmentById(courseId, enrollmentActions) {
  if (!ObjectId.isValid(courseId)) {
    return null;
  } else {
    studentsToAdd = enrollmentActions['add'];
    if (studentsToAdd) {
      for (const studentId of studentsToAdd){
        const result = await enrollStudentInCourse(studentId, courseId);
        console.log("Adding student:", studentId, "to course:", courseId);
      }
    }
    studentsToRemove = enrollmentActions['remove'];
    if (studentsToRemove) {
      for (const studentId of studentsToRemove){
        const result = await removeStudentFromCourse(studentId, courseId);
        console.log("Removing student:", studentId, "from course:", courseId);
      }
    }
    return true;
  }
}
exports.updateCourseEnrollmentById = updateCourseEnrollmentById;

/*
 * Executes a DB query to fetch all enrollments for a specific
 * course, based on on the course's ID.  Returns a Promise that resolves to an array
 * containing the requested enrollments.  This array could be empty if the
 * specified course does not have any students.  This function does not verify
 * that the specified user ID corresponds to a valid course.
 */
async function getEnrollmentsByCourseId(id) {
  const db = getDBReference();
  const collection = db.collection('users_courses');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({ "courseId": id })
      .toArray();
    if (!results) {
      return null;
    }
    studentList = []
    for (const result of results){
      studentList.push(result['studentId']);
    }
    return { students: studentList };
  }
}
exports.getEnrollmentsByCourseId = getEnrollmentsByCourseId;

// TODO 2/3: Remove this function when user is in
/*
 * Fetch a user from the DB based on user ID.
 */
getUserByIdForRoster = async function (id, includePassword) {
  const db = getDBReference();
  const collection = db.collection('users');

  const results = await collection
    .find({ _id: new ObjectId(id) }, { _id: 1, name:1, email:1})
    .toArray();
  return results[0];
};

async function getRosterByCourseId(id) {
  // TODO 3/3: delete sample here
  /*
  const enrollments = [
    {
      "id": "asdlkje4rl3j4r",
      "name": "Sean",
      "email": "gillens@oregonstate.edu",
    },
    {
      "id": "asxghxlkje4rl3j4r",
      "name": "Rob Student",
      "email": "abc@oregonstate.edu",
    }
  ]
  return enrollments;
  */

  const studentIdList = await getEnrollmentsByCourseId(id);
  if (!studentIdList) {
    return null;
  }
  console.log("=studentIdList exists:");
  console.log(studentIdList);

  studentRecordList = [];
  for (const studentId of studentIdList['students']) {
    console.log("=studentId:", studentId);
    var studentRecord = await getUserByIdForRoster(studentId);
    if (studentRecord) {
      delete studentRecord.password;
      delete studentRecord.role;
      studentRecordList.push(studentRecord);
    } else {
      console.log("Couldn't look up id:", studentId);
    }
  }

  return studentRecordList;
}
exports.getRosterByCourseId = getRosterByCourseId;
