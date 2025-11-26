import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    likeCount: {
        type: Number,
        default: 0,
    },
    writer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
        validate: {
            validator: async function (id) {
                const user = await mongoose.model("User").findById(id);
                return user !== null;
            },
            message: "Writer must be a valid user"
        }
    },
},
    { timestamps: true }
);

export default mongoose.model("Post", PostSchema);