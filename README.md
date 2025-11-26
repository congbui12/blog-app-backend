# 1. Introduction
This is the **backend** of a fullstack MERN blog application, built with **Node.js**, **Express.js** and **MongoDB**. It provides a secure RESTful API for user authentication, post and comment management, profile customization and favorites functionality.

# 2. Features

**Register**

POST /api/v1/auth/register

```json
{
    "username": "username",
    "email": "email@gmail.com",
    "password": "abc12*"
}
```
**Login**

POST /api/v1/auth/login

```json
{
    "login": "username",
    "password": "abc12*"
}
```

**View general user data**

GET /api/v1/user

**Edit general user data**

PATCH /api/v1/user

```json
{
    "newUsername": "username1"
}
```

**Change password**

PATCH /api/v1/user/change-password

```json
{
    "currentPassword": "abc12*",
    "newPassword": "Abc12*",
    "confirmPassword": "Abc12*"
}
```

**Change email (with confirmation)**

PATCH /api/v1/user/change-email

```json
{
    "newEmail": "newEmail@gmail.com"
}
```

GET /api/v1/user/confirm-email?token=


**Logout**

POST /api/v1/auth/logout

**Forgot password**

POST /api/v1/auth/forgot-password

```json
{
    "email": "newEmail@gmail.com"
}
```

**Reset password**

POST /api/v1/auth/reset-password

```json
{
    "resetPasswordToken": "",
    "newPassword": "Abc12**"
}
```

**Create new posts**

POST /api/v1/post

```json
{
    "title": "",
    "content": ""
}
```
**View single post data**

GET /api/v1/post/:slug

**Edit single post data**

PATCH /api/v1/post/:slug

```json
{
    "newTitle": "",
    "newContent": ""
}
```

**Add post to favorites**

POST /api/v1/post/favorites/:slug

**Remove post from favorites**

DELETE /api/v1/post/favorites/:slug


**Add comments**

POST /api/v1/comment/:postSlug

```json
{
    "text": ""
}
```

**Edit comments**

PATCH /api/v1/comment/:id

```json
{
    "newText": ""
}
```

**List comments of posts**

GET /api/v1/comment/:postSlug

**Delete comments**

DELETE /api/v1/comment/:id

**List personal posts**

GET /api/v1/user/posts?sortedBy=&page=&limit=&search=

**List favorite posts**

GET /api/v1/user/favorites?cusor=&limit=

**List general posts**

GET /api/v1/post?sortedBy=&page=&limit=&search=

**Delete posts**

DELETE /api/v1/post/:slug

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
