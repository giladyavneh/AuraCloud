import { mongoose } from "utils";

export type WatchlistResource = { arn: string; actions: string[] };
export type Watchlist = { name: string; userId: string; resources: WatchlistResource[] };

const userResourceWatchlistSchema = new mongoose.Schema<Watchlist>({
    name: { type: String, required: true },
    userId: { type: String, required: true },
    resources: [
        {
            arn: { type: String, required: true },
            actions: [{ type: String }],
        },
    ],
});

export const UserResourceWatchlistModel =
    (mongoose.models.UserResourceWatchlist as mongoose.Model<Watchlist>) ||
    mongoose.model<Watchlist>("UserResourceWatchlist", userResourceWatchlistSchema);
