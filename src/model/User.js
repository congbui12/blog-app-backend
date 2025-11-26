import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    // role: {
    //     type: String,
    //     required: true,
    //     enum: ["admin", "user"],
    //     default: "user",
    // },
    resetPasswordToken: {
        type: String,
        default: undefined,
    },
    resetPasswordTokenExpiry: {
        type: Date,
        default: undefined,
    },
    pendingEmail: {
        type: String,
        default: undefined,
    },
    updateEmailToken: {
        type: String,
        default: undefined,
    },
    updateEmailTokenExpiry: {
        type: Date,
        default: undefined,
    },
},
    { timestamps: true }
);

export default mongoose.model("User", UserSchema);