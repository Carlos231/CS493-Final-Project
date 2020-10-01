/*
 * API sub-router for assignments collection endpoints.
 */

const router = require('express').Router();

const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');

const { validateAgainstSchema } = require('../lib/validation');
const {
  AssignmentSchema,
  getSubmissionsPage,
  insertNewAssignment,
  getAssignmentDetailsById,
  updateAssignmentByID,
  deleteAssignmentByID,
  saveFile,
  saveFileInfo,
  getFileDownloadsByFilename,
  getSubmissionById,
  getFileInfoById
} = require('../models/assignment');

const fileTypes = {
  // 'text/plain': 'txt',
  'application/pdf': 'pdf'
};

// crate a new filename for the submission
const upload = multer({
  // dest: `${__dirname}/uploads`
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = fileTypes[file.mimetype];
      callback(null, `${filename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    callback(null, !!fileTypes[file.mimetype]);
  }
});

function removeUploadedFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file.path, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/*
 * Route to return a paginated list of submissions for specific assginment.
 */
router.get('/:id/submissions', async (req, res, next) => {
  try {
    /*
     * Fetch page info, generate HATEOAS links for surrounding pages and then
     * send response.
     */
    const assignmentPage = await getSubmissionsPage((parseInt(req.query.page) || 1), req.params.id, (req.query.studentId || null));

    assignmentPage.links = {};
    if (assignmentPage.page < assignmentPage.totalPages) {
      assignmentPage.links.nextPage = `/assignments?page=${assignmentPage.page + 1}`;
      assignmentPage.links.lastPage = `/assignments?page=${assignmentPage.totalPages}`;
    }
    if (assignmentPage.page > 1) {
      assignmentPage.links.prevPage = `/assignments?page=${assignmentPage.page - 1}`;
      assignmentPage.links.firstPage = '/assignments?page=1';
    }
    res.status(200).send(assignmentPage);
  } catch (err) {
    next(err);
  }
});

/*
 * Route to create a new assignment.
 */
router.post('/', async (req, res) => {
  if (validateAgainstSchema(req.body, AssignmentSchema)) {
    try {
      const id = await insertNewAssignment(req.body);
      res.status(201).send({
        id: id,
        links: {
          assignment: `/assignments/${id}`
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Error inserting assignment into DB.  Please try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid assignment object."
    });
  }
});

/*
 * Route to create a new submission for an assignment.
 */
router.post('/:id/submissions', upload.single('file'), async (req, res, next) => {
  console.log("== req.file:", req.file);
  console.log("== req.body:", req.body);
  if (req.file && req.body && req.body.studentId && req.body.timestamp) {
    const submission = {
      contentType: req.file.mimetype,
      filename: req.file.filename,
      path: req.file.path,
      assignmentId: req.params.id,
      studentId: req.body.studentId,
      timestamp: req.body.timestamp
    };
    const id = await saveFile(submission);
    const id2 = await saveFileInfo(submission, id);
    await removeUploadedFile(req.file);
    res.status(201).send({
      id: id2,
      link: `/assignments/${id}/submissions`
    });
  } else {
    res.status(400).send({
      error: "Request body is missing required fields."
    });
  }
});

// serve out of GridFS - get image using filename
router.get('/submissions/:filename', async (req, res, next) => {
  getFileDownloadsByFilename(req.params.filename)
    //attach event listeners
    .on('file', (file) => {
      res.status(200).type(file.metadata.contentType)
    })
    // if file doesnt exist
    .on('error', (err) => {
      //triggers 404 error
      if (err.code === 'ENOENT') {
        next();
      } else {
        //triggers 500 error handler
        next(err);
      }
    })
    .pipe(res);
});

/*
 * Route to fetch info about a specific assignment.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const assignment = await getAssignmentDetailsById(req.params.id);
    if (assignment) {
      res.status(200).send(assignment);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch assignment.  Please try again later."
    });
  }
});

/*
 * Route to update info about a specific assignment.
 */
router.patch('/:id', async (req, res, next) => {
  if (validateAgainstSchema(req.body, AssignmentSchema)) {
    try {
      const updateSuccessful = await updateAssignmentByID(req.params.id, req.body);
      if (updateSuccessful) {
        res.status(200).send({});
      } else {
        next();
      }
    } catch (err) {
      res.status(500).send({
        error: "Unable to update Assignment."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid assignment object."
    });
  }
});

/*
 * Route to delete an assignment.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleteSuccessful = await deleteAssignmentByID(req.params.id);
    if (deleteSuccessful) {
       res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Unable to delete lodging."
    });
  }
});

module.exports = router;
