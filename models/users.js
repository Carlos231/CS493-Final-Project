/*
 * Review schema and data accessor methods.
 */
 const { ObjectId } = require('mongodb');

 const { getDBReference } = require('../lib/mongo');
 const { extractValidFields } = require('../lib/validation');

/*
 * Schema for a User.
 */
const UserSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  role: { required: false}
};
exports.UserSchema = UserSchema;

/*
 * Insert a new User into the DB.
 */
exports.insertNewUser = async function (user) {
  const userToInsert = extractValidFields(user, UserSchema);
  console.log("  -- userToInsert:", userToInsert);
  userToInsert.password = await bcrypt.hash(
    userToInsert.password,
    8
  );
  console.log("  -- userToInsert after hash:", userToInsert);
  const db = getDBReference();
  const collection = db.collection('users');
  const result = await collection.insertOne(userToInsert)
  console.log("-- result:", result);
  return result.insertedId;
};

/*
 * Fetch a user from the DB based on user ID.
 */
exports.getUserById = async function (id, includePassword) {
  const db = getDBReference();
  const collection = db.collection('users');

  if(includePassword) { // if includePassword = true, return all info
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();
    return result[0];
  } else { // if includePassword = false, leave out password
    const results = await collection
      .find({ _id: new ObjectId(id) }, { name:1, email:1, role:1})
      .toArray();
    return result[0];
  }
};

exports.validateUser = async function(id, password) {
  const user = await exports.getUserById(id, true);
  return user &&
    await bcrypt.compare(password, user.password);
};

// Return the role of that user
exports.validateRole = async function(id) {
  const user = await exports.getUserById(id);
  const userRole = user.role || 'undefined';
  console.log(" -- userRole:", userRole);
  return userRole;
}
