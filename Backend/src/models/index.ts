import { User } from './User';
import { Post } from './Post';
import { PostLikes } from './PostLikes';
import { PostComments } from './PostComments';
import { VideoCalls } from './VideoCalls';
import { FriendRequest } from './FriendRequest';
import { Friends } from './Friends';
import ChatMessages from './ChatMessages';
import { UserBlocks } from './UserBlocks';
import { VideoCallRatings } from './VideoCallRatings';
import { Reports } from './Reports';
import { ContentModeration } from './ContentModeration';
import { Notifications } from './Notifications';
import { SavedPosts } from './SavedPosts';
import { Logs } from './Logs';
import { JWT } from './JWT';

// User & Post relationships
User.hasMany(Post, {
  foreignKey: 'user_id',
  sourceKey: 'user_id',
  as: 'posts'
});

Post.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'user_id',
  as: 'author'
});

// User & PostLikes relationships
User.hasMany(PostLikes, {
  foreignKey: 'user_id',
  sourceKey: 'user_id',
  as: 'likes'
});

PostLikes.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'user_id',
  as: 'user'
});

// Post & PostLikes relationships
Post.hasMany(PostLikes, {
  foreignKey: 'post_id',
  sourceKey: 'post_id',
  as: 'likes'
});

PostLikes.belongsTo(Post, {
  foreignKey: 'post_id',
  targetKey: 'post_id',
  as: 'post'
});

// User & PostComments relationships
User.hasMany(PostComments, {
  foreignKey: 'user_id',
  sourceKey: 'user_id',
  as: 'comments'
});

PostComments.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'user_id',
  as: 'author'
});

// Post & PostComments relationships
Post.hasMany(PostComments, {
  foreignKey: 'post_id',
  sourceKey: 'post_id',
  as: 'comments'
});

PostComments.belongsTo(Post, {
  foreignKey: 'post_id',
  targetKey: 'post_id',
  as: 'post'
});

// User & VideoCalls relationships
User.hasMany(VideoCalls, {
  foreignKey: 'user1_id',
  sourceKey: 'user_id',
  as: 'outgoingCalls'
});

User.hasMany(VideoCalls, {
  foreignKey: 'user2_id',
  sourceKey: 'user_id',
  as: 'incomingCalls'
});

VideoCalls.belongsTo(User, {
  foreignKey: 'user1_id',
  targetKey: 'user_id',
  as: 'caller'
});

VideoCalls.belongsTo(User, {
  foreignKey: 'user2_id',
  targetKey: 'user_id',
  as: 'receiver'
});

// User & FriendRequest relationships
User.hasMany(FriendRequest, {
  foreignKey: 'sender_id',
  sourceKey: 'user_id',
  as: 'sentFriendRequests'
});

User.hasMany(FriendRequest, {
  foreignKey: 'receiver_id',
  sourceKey: 'user_id',
  as: 'receivedFriendRequests'
});

FriendRequest.belongsTo(User, {
  foreignKey: 'sender_id',
  targetKey: 'user_id',
  as: 'sender'
});

FriendRequest.belongsTo(User, {
  foreignKey: 'receiver_id',
  targetKey: 'user_id',
  as: 'receiver'
});

// User & Friends relationships
User.hasMany(Friends, {
  foreignKey: 'user1_id',
  sourceKey: 'user_id',
  as: 'friendships1'
});

User.hasMany(Friends, {
  foreignKey: 'user2_id',
  sourceKey: 'user_id',
  as: 'friendships2'
});

Friends.belongsTo(User, {
  foreignKey: 'user1_id',
  targetKey: 'user_id',
  as: 'user1'
});

Friends.belongsTo(User, {
  foreignKey: 'user2_id',
  targetKey: 'user_id',
  as: 'user2'
});

// User & ChatMessages relationships
User.hasMany(ChatMessages, {
  foreignKey: 'sender_id',
  as: 'sentMessages'
});

User.hasMany(ChatMessages, {
  foreignKey: 'receiver_id',
  as: 'receivedMessages'
});

ChatMessages.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender'
});

ChatMessages.belongsTo(User, {
  foreignKey: 'receiver_id',
  as: 'receiver'
});

// User & UserBlocks relationships
User.hasMany(UserBlocks, {
  foreignKey: 'blocker_id',
  sourceKey: 'user_id',
  as: 'blockedUsers'
});

User.hasMany(UserBlocks, {
  foreignKey: 'blocked_id',
  sourceKey: 'user_id',
  as: 'blockedBy'
});

UserBlocks.belongsTo(User, {
  foreignKey: 'blocker_id',
  targetKey: 'user_id',
  as: 'blocker'
});

UserBlocks.belongsTo(User, {
  foreignKey: 'blocked_id',
  targetKey: 'user_id',
  as: 'blocked'
});

// VideoCalls & VideoCallRatings relationships
VideoCalls.hasMany(VideoCallRatings, {
  foreignKey: 'video_call_id',
  sourceKey: 'call_id',
  as: 'ratings'
});

VideoCallRatings.belongsTo(VideoCalls, {
  foreignKey: 'video_call_id',
  targetKey: 'call_id',
  as: 'videoCall'
});

// User & VideoCallRatings relationships
User.hasMany(VideoCallRatings, {
  foreignKey: 'rater_id',
  sourceKey: 'user_id',
  as: 'givenRatings'
});

User.hasMany(VideoCallRatings, {
  foreignKey: 'rated_id',
  sourceKey: 'user_id',
  as: 'receivedRatings'
});

VideoCallRatings.belongsTo(User, {
  foreignKey: 'rater_id',
  targetKey: 'user_id',
  as: 'rater'
});

VideoCallRatings.belongsTo(User, {
  foreignKey: 'rated_id',
  targetKey: 'user_id',
  as: 'rated'
});

// User & Reports relationships
User.hasMany(Reports, {
  foreignKey: 'reporter_id',
  sourceKey: 'user_id',
  as: 'submittedReports'
});

User.hasMany(Reports, {
  foreignKey: 'reported_user_id',
  sourceKey: 'user_id',
  as: 'receivedReports'
});

Reports.belongsTo(User, {
  foreignKey: 'reporter_id',
  targetKey: 'user_id',
  as: 'reporter'
});

Reports.belongsTo(User, {
  foreignKey: 'reported_user_id',
  targetKey: 'user_id',
  as: 'reportedUser'
});

// User & ContentModeration relationships
User.hasMany(ContentModeration, {
  foreignKey: 'moderator_id',
  sourceKey: 'user_id',
  as: 'moderationActions'
});

User.hasMany(ContentModeration, {
  foreignKey: 'reported_user_id',
  sourceKey: 'user_id',
  as: 'moderationReports'
});

ContentModeration.belongsTo(User, {
  foreignKey: 'moderator_id',
  targetKey: 'user_id',
  as: 'moderator'
});

ContentModeration.belongsTo(User, {
  foreignKey: 'reported_user_id',
  targetKey: 'user_id',
  as: 'reportedUser'
});

// User & Notifications relationships
User.hasMany(Notifications, {
  foreignKey: 'user_id',
  sourceKey: 'user_id',
  as: 'notifications'
});

Notifications.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'user_id',
  as: 'user'
});

// User & SavedPosts relationships
User.hasMany(SavedPosts, {
  foreignKey: 'user_id',
  sourceKey: 'user_id',
  as: 'savedPosts'
});

SavedPosts.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'user_id',
  as: 'user'
});

// Post & SavedPosts relationships
Post.hasMany(SavedPosts, {
  foreignKey: 'post_id',
  sourceKey: 'post_id',
  as: 'savedBy'
});

SavedPosts.belongsTo(Post, {
  foreignKey: 'post_id',
  targetKey: 'post_id',
  as: 'post'
});

export {
  User,
  Post,
  PostLikes,
  PostComments,
  VideoCalls,
  FriendRequest,
  Friends,
  ChatMessages,
  UserBlocks,
  VideoCallRatings,
  Reports,
  ContentModeration,
  Notifications,
  SavedPosts,
  Logs,
  JWT
};
