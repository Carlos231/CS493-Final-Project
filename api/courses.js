/*
 * API sub-router for courses collection endpoints.
 */

const router = require('express').Router();
const { Parser } = require('json2csv');

const { validateAgainstSchema } = require('../lib/validation');
const {
  CourseSchema,
  getCoursesPage,
  insertNewCourse,
  getCourseById,
  updateCourseById,
  deleteCourseById,
  getCoursesByInstructorId
} = require('../models/course');
const {
  EnrollmentSchema,
  updateCourseEnrollmentById,
  getEnrollmentsByCourseId,
  getRosterByCourseId
} = require('../models/user_course');
const {
  getAssignmentIdsByCourseId
} = require('../models/assignment');

const { requireAuthentication } = require('../lib/auth');

/*
 * Route to return a paginated list of courses.
 */
router.get('/', async (req, res) => {
  try {
    /*
     * Fetch page info, generate HATEOAS links for surrounding pages and then
     * send response.
     */
    const coursePage = await getCoursesPage(parseInt(req.query.page) || 1, req.query.subject, req.query.number, req.query.term);
    coursePage.links = {};
    if (coursePage.page < coursePage.totalPages) {
      coursePage.links.nextPage = `/courses?page=${coursePage.page + 1}`;
      coursePage.links.lastPage = `/courses?page=${coursePage.totalPages}`;
    }
    if (coursePage.page > 1) {
      coursePage.links.prevPage = `/courses?page=${coursePage.page - 1}`;
      coursePage.links.firstPage = '/courses?page=1';
    }
    res.status(200).send(coursePage);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Error fetching courses list.  Please try again later."
    });
  }
});

/*
 * Route to create a new course.
 */
router.post('/', async (req, res) => {
  if (validateAgainstSchema(req.body, CourseSchema)) {
    try {
      const id = await insertNewCourse(req.body);
      res.status(201).send({
        id: id,
        links: {
          course: `/courses/${id}`
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Error inserting course into DB.  Please try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid course object."
    });
  }
});

/*
 * Route to fetch info about a specific course.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const course = await getCourseById(req.params.id);
    if (course) {
      res.status(200).send(course);
    } else {
      res.status(404).send({
        error: "Specified Course id not found."
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch course.  Please try again later."
    });
  }
});

/*
 * Route to update info about a specific course.
 */
router.patch('/:id', async (req, res, next) => {
  if (validateAgainstSchema(req.body, CourseSchema)) {
    try {
      const updateSuccessful = await updateCourseById(req.params.id, req.body);
      if (updateSuccessful) {
        res.status(200).send({});
      } else {
        res.status(404).send({
          error: "Specified Course id not found."
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).send({
        error: "Unable to update course."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid course object."
    });
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleteSuccessful = await deleteCourseById(req.params.id);
    if (deleteSuccessful) {
       res.status(204).end();
    } else {
      res.status(404).send({
        error: "Specified Course id not found."
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Unable to delete course."
    });
  }
});

/*
 * Route to update enrollment for course.
 */
router.post('/:id/students', async (req, res) => {
  if (validateAgainstSchema(req.body, EnrollmentSchema)) {
    try {
      const updateSuccess = await updateCourseEnrollmentById(req.params.id, req.body);
      if (updateSuccess) {
        res.status(200).send({});
      } else {
        res.status(404).send({
          error: "Specified Course id not found."
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Error updating enrollment.  Please try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid enrollment command."
    });
  }
});

/*
 * Route to fetch students for a specific course.
 */
router.get('/:id/students', async (req, res, next) => {
  try {
    const enrollments = await getEnrollmentsByCourseId(req.params.id);
    if (enrollments) {
      res.status(200).send(enrollments);
    } else {
      res.status(404).send({
        error: "Specified Course id not found."
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch enrollments.  Please try again later."
    });
  }
});

/*
 * Route to fetch student roster for a specific course.
 */
router.get('/:id/roster', async (req, res, next) => {
  try {
    const enrollments = await getRosterByCourseId(req.params.id);
    console.log(enrollments);
    if (enrollments) {
      let csv;
      if (enrollments.length == 0 ) {
        csv = "";
      } else {
        const parser = new Parser();
        csv = parser.parse(enrollments, fields=["_id", "name", "email"]);
      }
      res.setHeader('Content-disposition', 'attachment; filename=roster.csv');
      res.status(200).send(csv);
    } else {
      res.status(404).send({
        error: "Specified Course id not found."
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch roster.  Please try again later."
    });
  }
});

router.get('/:id/assignments', async (req, res, next) => {
  try {
    // check course exists
    const course = await getCourseById(req.params.id);
    if (!course) {
      res.status(404).send({
        error: "Specified Course id not found."
      });
    } else {
      const assignments = await getAssignmentIdsByCourseId(req.params.id);
      console.log(assignments);
      if (assignments) {
        res.status(200).send({ assignments: assignments });
      } else {
        next();
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch assignments.  Please try again later."
    });
  }
});

module.exports = router;
