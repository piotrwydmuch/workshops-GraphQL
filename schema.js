const graphql = require('graphql');
const db = require('./db');
const { v4 } = require('uuid');

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLSchema,
    GraphQLList,
    GraphQLBoolean
} = graphql;

const Tasks = new GraphQLObjectType({
    name: 'Task',
    fields: () => (
        {
        id: { type: GraphQLString},
        title: { type: GraphQLString},
        description: { type: GraphQLString},
        completed: { type: GraphQLBoolean},
        userId: { type: GraphQLString}
    }
    )
});

const TaskType = new GraphQLObjectType({
    name: 'TaskType',
    fields: () => (
        {
        id: { type: GraphQLString},
        title: { type: GraphQLString},
        description: { type: GraphQLString},
        completed: { type: GraphQLBoolean},
        user: {type: UserType,
            resolve: (parent) => {
                return db.get('users').filter({ id: parent.userId}).value();
            }}
    }
    )
});

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => (
        {
        id: { type: GraphQLString},
        name: { type: GraphQLString},
        email: { type: GraphQLString},
        password: { type: GraphQLString},
        tasks: {
            type: GraphQLList(TaskType),
            resolve: (parent) => {
                return db.get('tasks')
                .filter({userId: parent.id})
                .value();
            }
        }
    }
    )
});

const Query = new GraphQLObjectType({
    name: 'Query',
    fields: {
        user: {
            type: UserType,
            args: {
              id: {type: GraphQLString }  
            },
            resolve: (parent, args) => {
                return db.get('users')
                .find({id: args.id})
                .value();
            }
        },
        users: {
            type: GraphQLList(UserType),
            resolve: (parent, args) => {
                return db.get('users')
                .value();
            }
        },
        task: {
            type: Tasks,
            args: {
              id: {type: GraphQLString } 
            },
            resolve: (parent, args) => {
                return db.get('tasks')
                .find({id: args.id})
                .value();
            }
        }
    }
})

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        signUp: {
            type: UserType,
            args: {
                name: {type: GraphQLString},
                email: {type: GraphQLString},
                password: {type: GraphQLString}
            },
            resolve: (parent, args) => {
                const newUser = { ...args, id: v4() };
                db.get('users').push(newUser).write();
                return newUser;
            } 
    },
        signIn: {
                type: UserType,
                args: {
                    email: {type: GraphQLString},
                    password: {type: GraphQLString}
                },
                resolve: (parent, args, { res }) => {
                    const user = { ...args, id: v4() };
                    db.get('users')
                    .find({ args: email}).value();

                    if (!user || user.password !== args.password ) {
                        res.status(404);
                        
                    }

                    res.cookies('userId', user.id, {
                        maxAge: 1000 * 60 * 60 * 24 * 365
                    });
                    return user;
                }
        },

        addTask: {
            type: Tasks,
            args: {
                id: {type:GraphQLString},
                title: {type: GraphQLString},
                description: {type: GraphQLString},
                completed: {type: GraphQLBoolean},
                userId: {type: GraphQLString}
            },
            resolve: (parent, args) => {
                const newTask = { ...args, id: v4() };
                db.get('tasks').push(newTask).write();
                return newTask;
            } 
    },
        
        signOut: {
                type: GraphQLBoolean,
                resolve: (parent, args, { res }) => {
                    res.clearCookie('userId');
                    return null;
                }
        }
    }
})

module.exports = new GraphQLSchema({
    query: Query,
    mutation: Mutation
})