import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Post",
        validate: {
            validator: async function (id) {
                const post = await mongoose.model("Post").findById(id);
                return post !== null;
            },
            message: "Invalid 'post' reference"
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
        validate: {
            validator: async function (id) {
                const user = await mongoose.model("User").findById(id);
                return user !== null;
            },
            message: "Invalid 'user' reference"
        }
    },
},
    { timestamps: true }
);

export default mongoose.model("Comment", CommentSchema);