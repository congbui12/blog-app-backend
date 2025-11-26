import mongoose from "mongoose";

const FavoritePostSchema = new mongoose.Schema({
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
    }
},
    { timestamps: true }
);

FavoritePostSchema.index({ user: 1, post: 1 }, { unique: true });

export default mongoose.model("FavoritePost", FavoritePostSchema);