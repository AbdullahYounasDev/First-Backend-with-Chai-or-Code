## Mongoose

- Mongoose is used in Node.js applications to interact with MongoDB in an organized and efficient way. It provides a schema-based solution to model your data, making it easier to define the structure and relationships of your data. Without Mongoose, you'd have to write more complex code to handle MongoDB operations directly.

## Refresh Token and Access Token

- These are use for authentication and authorization. Refresh Token is for long time and Access token is for short time. Refresh token is stored in db. And both access and refresh are stored in cookies. If access token is expired then frontend dev can create an endpoint which is use to check is the refresh token in cookie matches refresh token in db then genrate an new access token so that user can login
