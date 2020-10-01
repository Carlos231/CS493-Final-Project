/*
 * Assignment schema and data accessor methods;
 */

const { ObjectId, GridFSBucket } = require('mongodb');
const fs = require('fs');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

/*
 * Schema describing required/optional fields of a assignment object.
 */
const AssignmentSchema = {
  courseId: { required: true },
  title: { required: true },
  points: { required: true },
  due: { required: true }
};
exports.AssignmentSchema = AssignmentSchema;

/*
 * Executes a DB query to return a single page of submissions based on an
 * assignment ID.  Returns a
 * Promise that resolves to an array containing the fetched page of submissions.
 */
async function getSubmissionsPage(page, id, studentId) {
  const db = getDBReference();
  const collection = db.collection('submissions');
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

  if (studentId !== null){
    const results = await collection.find({ assignmentId: id, studentId: studentId })
      .sort({ _id: 1 })
      .skip(offset)
      .limit(pageSize)
      .toArray();
    return {
      submissions: results,
      page: page,
      totalPages: lastPage,
      pageSize: pageSize,
      count: count
    };
  } else {
    const results = await collection.find({ assignmentId: id })
      .sort({ _id: 1 })
      .skip(offset)
      .limit(pageSize)
      .toArray();
    return {
      submissions: results,
      page: page,
      totalPages: lastPage,
      pageSize: pageSize,
      count: count
    };
  }


}
exports.getSubmissionsPage = getSubmissionsPage;

/*
 * Executes a DB query to insert a new assignment into the database.  Returns
 * a Promise that resolves to the ID of the newly-created assignment entry.
 */
async function insertNewAssignment(assignment) {
  assignment = extractValidFields(assignment, AssignmentSchema);
  const db = getDBReference();
  const collection = db.collection('assignments');
  const result = await collection.insertOne(assignment);
  return result.insertedId;
}
exports.insertNewAssignment = insertNewAssignment;

/*
 * Executes a DB query to fetch information about a single specified
 * assignment based on its ID.  Does not fetch photo data for the
 * assignment.  Returns a Promise that resolves to an object containing
 * information about the requested assignment.  If no assignment with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getAssignmentById(id) {
  const db = getDBReference();
  const collection = db.collection('assignments');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
}
exports.getAssignmentById = getAssignmentById;

/*
 * Executes a MySQL query to fetch detailed information about a single
 * specified assignment based on its ID, including photo data for
 * the assignment.  Returns a Promise that resolves to an object containing
 * information about the requested assignment.  If no assignment with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getAssignmentDetailsById(id) {
  /*
   * Execute three sequential queries to get all of the info about the
   * specified assignment, including its photos.
   */
  const assignment = await getAssignmentById(id);
  // if (assignment) {
  //   // assignment.photos = await getPhotosByAssignmentId(id);
  // }
  return assignment;
}
exports.getAssignmentDetailsById = getAssignmentDetailsById;

async function getAssignmentsByCourseId(courseId) {
  const db = getDBReference();
  const collection = db.collection('assignments');
  if (!ObjectId.isValid(courseId)) {
    return null;
  } else {
    const results = await collection
      .find({ courseId: courseId })
      .toArray();
    return results;
  }
}
exports.getAssignmentsByCourseId = getAssignmentsByCourseId;

async function getAssignmentIdsByCourseId(courseId) {
  const assignments = await getAssignmentsByCourseId(courseId);
  if (!assignments) {
    return [];
  }

  var assignmentIds = [];
  for (const assignment of assignments) {
    assignmentIds.push(assignment['_id']);
  }
  return assignmentIds;
}
exports.getAssignmentIdsByCourseId = getAssignmentIdsByCourseId;

async function updateAssignmentByID(id, assignment) {
  const assignmentValues = {
    courseId: assignment.courseId,
    title: assignment.title,
    points: assignment.points,
    due: assignment.due
  };
  const db = getDBReference();
  const collection = db.collection('assignments');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: assignmentValues }
    );
    console.log(result.matchedCount);
    return result.matchedCount > 0;
  }
}
exports.updateAssignmentByID = updateAssignmentByID;

async function deleteAssignmentByID(id) {
  const db = getDBReference();
  const collection = db.collection('assignments');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  }
}
exports.deleteAssignmentByID = deleteAssignmentByID;

exports.saveFile = async function (file) {
  return new Promise((resolve, reject) => {
    const db = getDBReference();
    const bucket = new GridFSBucket(db, {
      bucketName: 'submissions'
    });
    const metadata = {
      contentType: file.contentType,
      assignmentId: file.assignmentId,
      studentId: file.studentId,
      timestamp: file.timestamp,
    };

    const uploadStream = bucket.openUploadStream(
      file.filename,
      { metadata: metadata }
    );
    fs.createReadStream(file.path).pipe(uploadStream)
      .on('error', (err) => {
        reject(err);
      })
      .on('finish', (result) => {
        resolve(result._id);
      });
  });
};

exports.saveFileInfo = async function (file, id) {
  const db = getDBReference();
  const collection = db.collection('submissions');

  const metadata = {
    contentType: file.contentType,
    assignmentId: file.assignmentId,
    studentId: file.studentId,
    timestamp: file.timestamp,
    file: `/assignments/submissions/${file.filename}`
  };

  const result = await collection.insertOne(metadata);
  return result.insertedId;
}

// pass name of file and return stream of image bytes out of GridFS
exports.getFileDownloadsByFilename = function (filename) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, {
    bucketName: 'submissions'
  });
  return bucket.openDownloadStreamByName(filename);
};

async function getSubmissionById(id) {
  const db = getDBReference();
  const collection = db.collection('submissions');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
}
exports.getSubmissionById = getSubmissionById;

exports.getFileInfoById = async function (id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, {
    bucketName: 'submissions'
  });
  // const collection = db.collection('photos');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    // read from mongodb
    // const results = await collection.find({ _id: new ObjectId(id) })
    //   .toArray();
    //read from GridFS
    const results = await bucket.find({ _id: new ObjectId(id)})
      .toArray();
    return results[0];
  }
};
