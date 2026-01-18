# 1. Introduction

This is the **backend** of a fullstack MERN blog application, built with **Node.js**, **Express.js** and **MongoDB**. It provides a secure RESTful API for user authentication, post and comment management, profile customization and favorites functionality.

# 2. Features

- Register

**POST /api/v1/auth/register**

```json
{
  "username": "",
  "email": "",
  "password": ""
}
```

- Login

**POST /api/v1/auth/login**

```json
{
  "login": "",
  "password": ""
}
```

- View personal data (Logged-in users only)

**GET /api/v1/users/me**

- Edit personal data (Logged-in users only)

**PATCH /api/v1/users/me**

```json
{
  "username": ""
}
```

- Change password (Logged-in users only)

**PATCH /api/v1/users/me/change-password**

```json
{
  "currentPassword": "",
  "newPassword": "",
  "confirmPassword": ""
}
```

- Logout (Logged-in users only)

**POST /api/v1/auth/logout**

- Forgot password

**POST /api/v1/auth/forgot-password**

```json
{
  "email": ""
}
```

- Reset password

**POST /api/v1/auth/reset-password**

```json
{
  "resetPasswordToken": "",
  "newPassword": ""
}
```

- Create new posts (Logged-in users only)

**POST /api/v1/posts**

```json
{
  "title": "",
  "content": "",
  "status": ""
}
```

- View post details (Published for anyone, draft for post author only)

**GET /api/v1/posts/:slug**

- Edit post data (post author only): Required at least 1 field provided

**PATCH /api/v1/posts/:slug**

```json
{
  "title": "",
  "content": "",
  "status": ""
}
```

- List published posts (Guests and logged-in users)

**GET /api/v1/posts?author=507f1f78b21f867039461704&page=1&limit=5&search=&status=published&sortedBy=latest**

- List personal posts (Logged-in users only)

**GET /api/v1/posts?author=507f1f78b21f867039461704&page=1&limit=5&search=&status=draft&sortedBy=latest**

- List favorite posts (Logged-in users only)

**GET /api/v1/posts/favorites?page=1&limit=5**

- Toggle favorite (Logged-in users only)

**POST /api/v1/posts/:slug/toggle-favorite**

- Add comments (Logged-in users only)

**POST /api/v1/comments/:postSlug**

```json
{
  "content": ""
}
```

- Edit comments (Post author or comment owner only)

**PATCH /api/v1/comments/:id**

```json
{
  "content": ""
}
```

- List comments of posts

**GET /api/v1/comments/:postSlug?cursor=null&limit=3&sortOrder=desc**

- Delete comments (Post author or comment owner only)

**DELETE /api/v1/comments/:id**

- Delete posts (Post author only)

**DELETE /api/v1/posts/:slug**

# 3. Tech Stack

- Node.js: Runtime environment

- Express.js: Web framework

- MongoDB: NoSQL Database

- Mongoose: ODM for MongoDB

- Passport.js: Authentication middleware

- express-session: Session management

# 4. Installation

```bash
# Clone the repository
git clone https://github.com/congbui12/blog-app-backend.git

# Navigate into the project
cd blog-app-backend

# Install dependencies
npm install

# Start the development server
npm run start:dev
```
