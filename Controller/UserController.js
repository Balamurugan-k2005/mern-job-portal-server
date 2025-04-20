const UserModel = require("../Model/UserModel");
const createError = require("http-errors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const JWTGenerator = require("../Utils/JWTGenerator");

exports.getAllUser = async (req, res, next) => {
    try {
        const result = await UserModel.find({}).select("-password");
        if (result.length !== 0) {
            res.status(200).json({
                status: true,
                result,
            });
        } else {
            next(createError(200, "User list is empty"));
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const me = req.user;
        if (!me) {
            // Return a 401 Unauthorized response with a clear message
            return res.status(401).json({
                status: false,
                message: "User is not authenticated",
            });
        }

        // Return user details without sensitive fields like password
        res.status(200).json({
            status: true,
            result: me,
        });
    } catch (error) {
        // Handle unexpected errors
        next(createError(500, error.message));
    }
};

exports.logOut = async (req, res, next) => {
    try {
        res.cookie(process.env.COOKIE_NAME, "", {
            sameSite: "none",
            secure: true,
            httpOnly: true,
            expires: new Date(0), // Set to a date in the past
            path: "/", // Ensure this matches the path set during login
        })
            .status(200)
            .json({
                status: true,
                message: "Logout done",
            });
    } catch (error) {
        next(createError(500, error.message));
    }
};

exports.getSingleUser = async (req, res, next) => {
    res.send("get single user");
};

exports.addUser = async (req, res, next) => {
    const data = req.body;
    try {
        const isUserExists = await UserModel.findOne({ email: data.email });
        if (isUserExists) {
            next(createError(500, "Email Already exists"));
        } else {
            const isFirstUser = (await UserModel.countDocuments()) === 0;
            req.body.role = isFirstUser ? "admin" : "user";
            const newUser = new UserModel(data);
            const result = await newUser.save();

            // Exclude(remove) password field from the result
            // const { password, ...resultWithoutPassword } = result.toObject();

            // const tokenObj = { ID: result._id, email: result.email };
            // const TOKEN = JWTGenerator(tokenObj, "1d");
            res.status(200).json({
                status: true,
                message: "Registered Successfully",
                // result: resultWithoutPassword,
                // TOKEN,
            });
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};

exports.loginUser = async (req, res, next) => {
    try {
        console.time("Total Login Time");

        const { email, password } = req.body;

        // Step 1: Find the user by email
        console.time("Find User");
        const isUserExists = await UserModel.findOne({ email });
        console.timeEnd("Find User");

        if (isUserExists) {
            // Step 2: Compare the password
            console.time("Password Comparison");
            const isPasswordMatched = await bcrypt.compare(password, isUserExists.password);
            console.timeEnd("Password Comparison");

            if (isPasswordMatched) {
                // Step 3: Generate a JWT token
                console.time("Token Generation");
                const tokenObj = { ID: isUserExists._id, role: isUserExists.role };
                const TOKEN = JWTGenerator(tokenObj);
                console.timeEnd("Token Generation");

                // Step 4: Set the cookie
                res.cookie(process.env.COOKIE_NAME, TOKEN, {
                    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
                    secure: true,
                    httpOnly: true,
                    signed: true,
                    sameSite: "None",
                });

                console.timeEnd("Total Login Time");
                return res.status(200).json({ status: true, message: "Login Successfully" });
            } else {
                next(createError(500, "Email or Password not matched"));
            }
        } else {
            next(createError(500, "User not found!!!"));
        }
    } catch (error) {
        console.timeEnd("Total Login Time");
        next(createError(500, `something wrong: ${error.message}`));
    }
};
exports.updateUser = async (req, res, next) => {
    const data = req.body;
    try {
        if (req?.user?.email !== data?.email) {
            next(createError(500, `You have no permission to update`));
        } else {
            const updateUser = await UserModel.updateOne(
                { _id: req.user._id },
                { $set: data }
            );

            if (updateUser.nModified > 0) {
                const updatedUser = await UserModel.findById(
                    req.user._id
                ).select("-password");
                res.status(200).json({
                    status: true,
                    message: "Profile Updated",
                    result: updatedUser,
                });
            } else {
                res.status(200).json({
                    status: false,
                    message: "No changes were made",
                    result: null,
                });
            }
        }
    } catch (error) {
        next(createError(500, `Something went wrong: ${error.message}`));
    }
};

exports.deleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid User ID format"));
        }

        const isUserExists = await UserModel.findOne({ _id: id });
        if (!isUserExists) {
            res.status(500).json({
                status: false,
                message: "User not found",
            });
        } else {
            const result = await UserModel.findByIdAndDelete(id);
            res.status(200).json({
                status: true,
                message: "User Deleted",
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

exports.deleteAllUser = async (req, res, next) => {
    try {
        result = await UserModel.deleteMany({});
        res.status(201).json({
            status: true,
            message: "All userd deleted",
        });
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};