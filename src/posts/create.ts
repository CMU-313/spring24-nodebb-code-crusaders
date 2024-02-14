import _ from 'lodash';
import meta from '../meta';
import db from '../database';
import plugins from '../plugins';
import user from '../user';
import topics from '../topics';
import categories from '../categories';
import groups from '../groups';
import utils from '../utils';

interface Posts {
  create: (data: {
    uid: string;
    tid: string;
    content: string;
    timestamp?: number;
    isMain?: boolean;
    anonymous?: boolean;
    toPid?: string;
    ip?: string;
    handle?: string;
  }) => Promise<{
    pid: string;
    uid: string;
    tid: string;
    content: string;
    timestamp: number;
    anonymous: boolean;
    toPid?: string;
    ip?: string;
    handle?: string;
    cid?: string;
    isMain: boolean;
  }>;
  uploads: {
    sync: (pid: string) => Promise<void>;
  };
}

export default function (Posts: Posts) {
    async function addReplyTo(
        postData: { toPid?: string; pid: string },
        timestamp: number
    ) {
        if (!postData.toPid) {
            return;
        }
        await Promise.all([
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            db.sortedSetAdd(`pid:${postData.toPid}:replies`, timestamp, postData.pid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            db.incrObjectField(`post:${postData.toPid}`, 'replies'),
        ]);
    }

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
            throw new Error('[[error:invalid-uid]]');
        }

        if (toPid && !utils.isNumber(toPid)) {
            throw new Error('[[error:invalid-pid]]');
        }

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const pid = (await db.incrObjectField('global', 'nextPid')) as {
      toString: () => string;
    };
        let postData: {
      pid: string;
      uid: string;
      tid: string;
      content: string;
      timestamp: number;
      anonymous: boolean;
      toPid?: string;
      ip?: string;
      handle?: string;
      cid?: string;
    } = {
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

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (ip && meta.config.trackIpPerPost) {
            postData.ip = ip;
        }
        if (handle && !parseInt(uid, 10)) {
            postData.handle = handle;
        }

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        let result = (await plugins.hooks.fire('filter:post.create', {
            post: postData,
            data,
        })) as {
      post: {
        pid: string;
        uid: string;
        tid: string;
        content: string;
        timestamp: number;
        anonymous: boolean;
        toPid?: string;
        ip?: string;
        handle?: string;
        cid?: string;
        isMain: boolean;
      };
    };
        postData = result.post;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.setObject(`post:${postData.pid}`, postData);

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const topicData = await topics.getTopicFields(tid, ['cid', 'pinned']) as {
        cid: string;
        pinned: boolean;
        };
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        postData.cid = topicData.cid;

        await Promise.all([
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            db.sortedSetAdd('posts:pid', timestamp, postData.pid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            db.incrObjectField('global', 'postCount'),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user.onNewPostMade(postData),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            topics.onNewPostMade(postData),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            categories.onNewPostMade(topicData.cid, topicData.pinned, postData),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            groups.onNewPostMade(postData),
            // The next line calls a function in a module that has not been updated to TS yet
            addReplyTo(postData, timestamp),
            Posts.uploads.sync(postData.pid),
        ]);

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        result = (await plugins.hooks.fire('filter:post.get', {
            post: postData,
            uid,
        })) as {
      post: {
        pid: string;
        uid: string;
        tid: string;
        content: string;
        timestamp: number;
        anonymous: boolean;
        toPid?: string;
        ip?: string;
        handle?: string;
        cid?: string;
        isMain: boolean;
      };
    };
        result.post.isMain = isMain;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await plugins.hooks.fire('action:post.save', {
            post: _.clone(result.post),
        });
        return result.post;
    };
}
