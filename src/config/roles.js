const allRoles = {
  user: [],
  admin: ['getUsers', 'manageUsers', 'getQuestions', 'manageQuestions'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

export { roles, roleRights };
