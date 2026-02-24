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

**GET /api/v1/posts/:postId**

- Edit post data (post author only): Required at least 1 field provided

**PATCH /api/v1/posts/:postId**

```json
{
  "title": "",
  "content": "",
  "status": ""
}
```

- List posts

**GET /api/v1/posts?page=&limit=&status=&sortedBy=&author=**

- Search posts

**GET /api/v1/posts/search?page=&limit=&term=&sortedBy=**

- List favorite posts (Logged-in users only)

**GET /api/v1/posts/favorites?page=&limit=**

- Toggle favorite (Logged-in users only)

**POST /api/v1/posts/:postId/toggle-favorite**

- Add comments (Logged-in users only)

**POST /api/v1/comments/:postId**

```json
{
  "content": ""
}
```

- Edit comments (Comment owner only)

**PATCH /api/v1/comments/:commentId**

```json
{
  "content": ""
}
```

- List comments of posts

**GET /api/v1/comments/:postId?cursor=&limit=&sortOrder=**

- Delete comments (Post author or comment owner only)

**DELETE /api/v1/comments/:commentId**

- Delete posts (Post author only)

**DELETE /api/v1/posts/:postId**

# 3. Tech Stack

- Node.js: Runtime environment

- Express.js: Web framework

- MongoDB: NoSQL Database

- Mongoose: ODM for MongoDB

- Passport.js: Authentication middleware

- MeiliSearch: Search engine (https://github.com/meilisearch/meilisearch/releases)

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
