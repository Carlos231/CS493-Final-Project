/*
 * Review schema and data accessor methods.
 */

const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');
//const { getAssignmentsByCourseId } = require('./assignment');

/*
 * Schema describing required/optional fields of a review object.
 */
const CourseSchema = {
  subject: { required: true },
  number: { required: true },
  title: { required: true },
  term: { required: true },
  instructorId: { required: true }
};
exports.CourseSchema = CourseSchema;

/*
 * Executes a DB query to return a single page of courses.  Returns a
 * Promise that resolves to an array containing the fetched page of courses.
 */
async function getCoursesPage(page, subject, number, term) {
  const db = getDBReference();
  const collection = db.collection('courses');
  const count = await collection.countDocuments();

  /*
   * Compute last page number and make sure page is within allowed bounds.
   * Compute offset into collection.
   */
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  let query = {}
  if (subject) {
    query['subject'] = subject;
  }
  if (number) {
    query['number'] = parseInt(number);
  }
  if (term) {
    query['term'] = term;
  }

  const results = await collection.find(query)
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  return {
    courses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };
}
exports.getCoursesPage = getCoursesPage;

/*
 * Executes a DB query to insert a new course into the database.  Returns
 * a Promise that resolves to the ID of the newly-created course entry.
 */
async function insertNewCourse(course) {
  course = extractValidFields(course, CourseSchema);
  const db = getDBReference();
  const collection = db.collection('courses');
  const result = await collection.insertOne(course);
  return result.insertedId;
}
exports.insertNewCourse = insertNewCourse;

/*
 * Executes a DB query to fetch information about a single specified
 * course based on its ID.  Does not fetch photo data for the
 * course.  Returns a Promise that resolves to an object containing
 * information about the requested course.  If no course with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getCourseById(id) {
  const db = getDBReference();
  const collection = db.collection('courses');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
}
exports.getCourseById = getCourseById;

/*
 * Executes a DB query to update a specified course with new data.
 * Returns a Promise that resolves to true if the course specified by
 * `id` existed and was successfully updated or to false otherwise.
 */

async function updateCourseById(id, course) {
  course = extractValidFields(course, CourseSchema);
/*
  const courseValues = {
    subject: course.subject,
    number: course.number,
    title: course.title,
    term: course.term,
    instructorId: course.instructorId
  };
*/
  console.log(course);

  const db = getDBReference();
  const collection = db.collection('courses');
  if (!ObjectId.isValid(id)) {
      return null;
    } else {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: course }
      );
      return result.matchedCount > 0;
  }
}
exports.updateCourseById = updateCourseById;

/*
 * Executes a DB query to delete a course specified by its ID.  Returns
 * a Promise that resolves to true if the course specified by `id` existed
 * and was successfully deleted or to false otherwise.
 */
async function deleteCourseById(id) {
  const db = getDBReference();
  const collection = db.collection('courses');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  }
}
exports.deleteCourseById = deleteCourseById;

/*
 * Executes a DB query to fetch all courses owned by a specified user,
 * based on on the user's ID.  Returns a Promise that resolves to an array
 * containing the requested courses.  This array could be empty if the
 * specified user does not own any courses.  This function does not verify
 * that the specified user ID corresponds to a valid user.
 */
async function getCoursesByInstructorId(id) {
  const db = getDBReference();
  const collection = db.collection('courses');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection.find({
      "instructorId": new ObjectId(id)
    });
    return results;
  }
}
exports.getCoursesByInstructorId = getCoursesByInstructorId;
