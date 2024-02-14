import _ from "lodash";
import meta from "../meta";
import db from "../database";
import plugins from "../plugins";
import user from "../user";
import topics from "../topics";
import categories from "../categories";
import groups from "../groups";
import utils from "../utils";

export default function (Posts: any) {
  Posts.create = async function (data: {
    uid: string;
    tid: string;
    content: string;
    timestamp?: number;
    isMain?: boolean;
    anonymous?: boolean;
    toPid?: string;
    ip?: string;
    handle?: string;
  }) {
    // This is an internal method, consider using Topics.reply instead
    const {
      uid,
      tid,
      content: contentRaw,
      timestamp: timestampRaw,
      isMain: isMainRaw,
      anonymous: anonymousRaw,
      toPid,
      ip,
      handle,
    } = data;
    const content = contentRaw.toString();
    const timestamp = timestampRaw || Date.now();
    const isMain = isMainRaw || false;
    const anonymous = anonymousRaw || false;

    if (!uid && parseInt(uid, 10) !== 0) {
      throw new Error("[[error:invalid-uid]]");
    }

    if (toPid && !utils.isNumber(toPid)) {
      throw new Error("[[error:invalid-pid]]");
    }

    const pid = await db.incrObjectField("global", "nextPid");
    let postData = {
      pid: pid.toString(),
      uid,
      tid,
      content,
      timestamp,
      anonymous,
      toPid: undefined,
      ip: undefined,
      handle: undefined,
      cid: undefined,
    };

    if (toPid) {
      postData.toPid = toPid;
    }
    if (ip && meta.config.trackIpPerPost) {
      postData.ip = ip;
    }
    if (handle && !parseInt(uid, 10)) {
      postData.handle = handle;
    }

    let result = await plugins.hooks.fire("filter:post.create", {
      post: postData,
      data,
    });
    postData = result.post;
    await db.setObject(`post:${postData.pid}`, postData);

    const topicData = await topics.getTopicFields(tid, ["cid", "pinned"]);
    postData.cid = topicData.cid;

    await Promise.all([
      db.sortedSetAdd("posts:pid", timestamp, postData.pid),
      db.incrObjectField("global", "postCount"),
      user.onNewPostMade(postData),
      topics.onNewPostMade(postData),
      categories.onNewPostMade(topicData.cid, topicData.pinned, postData),
      groups.onNewPostMade(postData),
      addReplyTo(postData, timestamp),
      Posts.uploads.sync(postData.pid),
    ]);

    result = await plugins.hooks.fire("filter:post.get", {
      post: postData,
      uid,
    });
    result.post.isMain = isMain;
    plugins.hooks.fire("action:post.save", { post: _.clone(result.post) });
    return result.post;
  };

  async function addReplyTo(
    postData: { toPid?: string; pid: string },
    timestamp: number
  ) {
    if (!postData.toPid) {
      return;
    }
    await Promise.all([
      db.sortedSetAdd(`pid:${postData.toPid}:replies`, timestamp, postData.pid),
      db.incrObjectField(`post:${postData.toPid}`, "replies"),
    ]);
  }
}
