const db = require("../models");
const User = db.users;
const Op = db.Sequelize.Op;
const AuthToken = db.validations;
const randomString = require('random-string');
const { Base64 } = require('js-base64');
const BASE_URL = "localhost:5000/api/login/validate/";
const sendGridMail = require('@sendgrid/mail');
sendGridMail.setApiKey('');


// Create and Save a new user
exports.create = (req, res) => {
    // Validate request
    if (!req.body.username || !req.body.email) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    // Create a user
    const user = {
        username: req.body.username,
        fname: req.body.fname,
        lname: req.body.lname,
        userType: req.body.userType,
        email: req.body.email,
        password: req.body.password,
        isActive: false
    };

    // Save user in the database
    User.create(user)
        .then(data => {

            //Create the validation token for the email
            let token = randomString({ length: 100 });
            let tokenObject = {
                email: req.body.email,
                token: token
            }
            AuthToken.create(tokenObject).then(response => {
                let validationString = req.body.email + ":" + token;
                let validationURL = BASE_URL + Base64.encode(validationString);
                console.log(validationURL);
                const msg = {
                    to: req.body.email, // Change to your recipient
                    from: 'info@richmun.org', // Change to your verified sender
                    subject: 'Vaidate Your Email',
                    html: '<strong>Please click the below link and verify your email.</strong><br><a href="'+validationURL+'">'+validationURL+'</a>',
                }
                sendGridMail
                    .send(msg)
                    .then(() => {
                        console.log('Email sent')
                    })
                    .catch((error) => {
                        res.status(400).send({
                            message: err.message || "Some error occurred while creating the user."
                        });
                    })

            }).then(() => {
                res.status(200).send({ "status": "success", "data": data, "token": token })
            })
                .catch(err => {
                    res.status(400).send({
                        message: err.message || "Some error occurred while creating the user."
                    });
                })
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the user."
            });
        });
};

// Find a single User with an id
exports.findOne = (req, res) => {
    console.log(req.body)
    const un = req.params.username;

    User.findByPk(un)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: "Error retrieving User with username=" + un
            });
        });
};

// Update a User by the id in the request
exports.update = (req, res) => {
    const un = req.params.username;

    User.update(req.body, {
        where: { username: un }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "User was updated successfully."
                });
            } else {
                res.send({
                    message: `Cannot update user with username=${un}. Maybe Tutorial was not found or req.body is empty!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error updating user with username=" + username
            });
        });
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
    const un = req.params.username;

    User.destroy({
        where: { username: un }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "User was deleted successfully!"
                });
            } else {
                res.send({
                    message: `Cannot delete user with username=${un}. Maybe user was not found!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Could not delete user with username=" + un
            });
        });
};

