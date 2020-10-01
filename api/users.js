const router = require('express').Router();
const { Parser } = require('json2csv');

const { validateAgainstSchema } = require('../lib/validation');

const { generateAuthToken, requireAuthentication } = require('../lib/auth');

const {
  UserSchema,
  insertNewUser,
  getUserById,
  validateUser,
  validateRole
} = require('../models/users');

router.post('/', requireAuthentication, async (req, res) => {
  const userRole = '';
  userRole = await validateRole(req.user);
  if ( userRole == 'admin') {
    // let them add any user with any role
    if (validateAgainstSchema(req.body, UserSchema)) {
      try {
        const id = await insertNewUser(req.body);
        res.status(201).send({
          _id: id
        });
      } catch (err) {
        console.error("  -- Error:", err);
        res.status(500).send({
          error: "Error inserting new user.  Try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body does not contain a valid User."
      });
    }
  } else { // then are a student or instructor
    // let them only add students
      if ( req.parmas.role == 'student') {
        if (validateAgainstSchema(req.body, UserSchema)) {
        try {
          const id = await insertNewUser(req.body);
          res.status(201).send({
            _id: id
          });
        } catch (err) {
          console.error("  -- Error:", err);
          res.status(500).send({
            error: "Error inserting new user.  Try again later."
          });
        }
      } else {
        res.status(400).send({
          error: "Request body does not contain a valid User."
        });
      }
    } else {
      res.status(403).send({
      error: "Unauthorized to create users. User not admin"
    });
    }
  }
});

/*
 * Get user by id
 */
router.get('/:id', requireAuthentication, async (req, res, next) => {
  const userRole = '';
  userRole = await validateRole(req.user);
  if (req.user == req.params.id || userRole == 'admin') {
    try {
      const user = await getUserById(req.params.id);
      if (user) {
        res.status(200).send(user);
      } else {
        next();
      }
    } catch (err) {
      console.error("  -- Error:", err);
      res.status(500).send({
        error: "Error fetching user.  Try again later."
      });
    }
  } else {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
});


/*
 * Login user and respond with jwt if password matches
*/
router.post('/login', async (req, res) => {
  if (req.body && req.body.id && req.body.password) {
    try {
      const authenticated = await validateUser(
        req.body.id,
        req.body.password
      );
      if (authenticated) {
        const token = generateAuthToken(req.body.id);
        res.status(200).send({
          token: token
        });
      } else {
        res.status(401).send({
          error: "Invalid authentication credentials."
        })
      }
    } catch (err) {
      console.error("  -- error:", err);
      res.status(500).send({
        error: "Error logging in.  Try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body needs a user ID and password."
    });
  }
});

module.exports = router;
