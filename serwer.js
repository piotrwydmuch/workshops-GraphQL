const expressGraphQL = require('express-graphql');
const express = require('express');
const schema = require('./schema');
const cookieParser = require('cookie-parser');
const app = express();

app.use('/graphql', expressGraphQL({
    graphiql: true,
    schema
}))

app.listen(3000, () => {
    console.log('Serwer działa');
});