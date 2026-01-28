# Frontend Integration Guide: Team & Role Management

This guide explains how to integrate the new granular role-based access control (RBAC) system into the CRM frontend.

## 1. Login Response Changes

When an admin logs in, the `admin` object now contains a populated `role` field with granular permissions.

**Example Response Body:**
```json
{
  "admin": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": {
      "id": "...",
      "name": "Support Staff",
      "permissions": {
        "dashboard": { "read": true },
        "userManagement": {
          "users": { "create": false, "read": true, "update": false, "delete": false },
          "teachers": { "create": false, "read": true, "update": false, "delete": false },
          "trainers": { "create": false, "read": true, "update": false, "delete": false }
        },
        "bookingManagement": { "create": true, "read": true, "update": true, "delete": false },
        "support": { "create": true, "read": true, "update": true, "delete": false },
        "companyManagement": { "read": false, "create": false, "update": false, "delete": false },
        "membershipManagement": { "read": false, "create": false, "update": false, "delete": false },
        "classManagement": { "read": false, "create": false, "update": false, "delete": false },
        "eventManagement": { "read": false, "create": false, "update": false, "delete": false }
      }
    }
  },
  "tokens": { ... }
}
```

## 2. Dynamic Sidebar Navigation

To implement dynamic navigation, you should check the `permissions` object before rendering sidebar items.

### Helper Function (Frontend)
```javascript
const hasPermission = (admin, modulePath, action = 'read') => {
  if (!admin || !admin.role) return false;
  
  // Super Admins usually have the role name "Super Admin" or full permissions
  if (admin.role.name === 'Super Admin') return true;

  const permissions = admin.role.permissions;
  const parts = modulePath.split('.');
  
  let current = permissions;
  for (const part of parts) {
    if (current && current[part]) {
      current = current[part];
    } else {
      return false;
    }
  }
  
  return current[action] === true;
};
```

### Implementing Sidebar Logic
```javascript
const sidebarItems = [
  { label: 'Dashboard', path: '/dashboard', visible: hasPermission(user, 'dashboard', 'read') },
  { label: 'Users', path: '/users', visible: hasPermission(user, 'userManagement.users', 'read') },
  { label: 'Teachers', path: '/teachers', visible: hasPermission(user, 'userManagement.teachers', 'read') },
  { label: 'Bookings', path: '/bookings', visible: hasPermission(user, 'bookingManagement', 'read') },
  // ... and so on
];

// Only render items where visible is true
return (
  <nav>
    {sidebarItems.filter(item => item.visible).map(item => (
      <Link to={item.path}>{item.label}</Link>
    ))}
  </nav>
);
```

## 3. Granular Action Protection (CRUD)

Inside a specific page (e.g., User Management), you can use the same logic to hide/show action buttons.

```javascript
// On the Users List page
{hasPermission(user, 'userManagement.users', 'create') && (
  <button onClick={handleAddUser}>Add New User</button>
)}

// Inside a table row
{hasPermission(user, 'userManagement.users', 'update') && (
  <button onClick={() => editUser(u.id)}>Edit</button>
)}

{hasPermission(user, 'userManagement.users', 'delete') && (
  <button onClick={() => deleteUser(u.id)}>Delete</button>
)}
```

## 4. API Reference

### Manage Roles
*   `GET /v1/roles`: List all roles for the dropdown when creating a team member.
*   `POST /v1/roles`: Create a new role (requires names and permissions object).
*   `PATCH /v1/roles/:roleId`: Modify role permissions.

### Manage Team Members
*   `GET /v1/admin/team`: List of all CRM team members.
*   `POST /v1/admin/team`: Create new team member (email, password, roleId).
*   `PATCH /v1/admin/team/:adminId`: Change password or role of a team member.

## 5. Permission Keys Mapping
Ensure your frontend UI matches these keys used in the backend:

| Module Key | Nested Key (optional) | Actions |
| :--- | :--- | :--- |
| `dashboard` | - | `read` |
| `userManagement` | `users`, `teachers`, `trainers` | `create`, `read`, `update`, `delete` |
| `companyManagement` | - | `create`, `read`, `update`, `delete` |
| `bookingManagement` | - | `create`, `read`, `update`, `delete` |
| `membershipManagement`| - | `create`, `read`, `update`, `delete` |
| `classManagement` | - | `create`, `read`, `update`, `delete` |
| `eventManagement` | - | `create`, `read`, `update`, `delete` |
| `support` | - | `create`, `read`, `update`, `delete` |
| `roleManagement` | - | `create`, `read`, `update`, `delete` |
| `teamManagement` | - | `create`, `read`, `update`, `delete` |
