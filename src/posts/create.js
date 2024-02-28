"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const meta_1 = __importDefault(require("../meta"));
const database_1 = __importDefault(require("../database"));
const plugins_1 = __importDefault(require("../plugins"));
const user_1 = __importDefault(require("../user"));
const topics_1 = __importDefault(require("../topics"));
const categories_1 = __importDefault(require("../categories"));
const groups_1 = __importDefault(require("../groups"));
const utils_1 = __importDefault(require("../utils"));
function default_1(Posts) {
    function addReplyTo(postData, timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!postData.toPid) {
                return;
            }
            yield Promise.all([
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                database_1.default.sortedSetAdd(`pid:${postData.toPid}:replies`, timestamp, postData.pid),
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                database_1.default.incrObjectField(`post:${postData.toPid}`, 'replies'),
            ]);
        });
    }
    Posts.create = function (data) {
        return __awaiter(this, void 0, void 0, function* () {
            // This is an internal method, consider using Topics.reply instead
            const { uid, tid, content: contentRaw, timestamp: timestampRaw, isMain: isMainRaw, anonymous: anonymousRaw, toPid, ip, handle, } = data;
            const content = contentRaw.toString();
            const timestamp = timestampRaw || Date.now();
            const isMain = isMainRaw || false;
            const anonymous = anonymousRaw || false;
            if (!uid && parseInt(uid, 10) !== 0) {
                throw new Error('[[error:invalid-uid]]');
            }
            if (toPid && !utils_1.default.isNumber(toPid)) {
                throw new Error('[[error:invalid-pid]]');
            }
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const pid = (yield database_1.default.incrObjectField('global', 'nextPid'));
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
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (ip && meta_1.default.config.trackIpPerPost) {
                postData.ip = ip;
            }
            if (handle && !parseInt(uid, 10)) {
                postData.handle = handle;
            }
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            let result = (yield plugins_1.default.hooks.fire('filter:post.create', {
                post: postData,
                data,
            }));
            postData = result.post;
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.setObject(`post:${postData.pid}`, postData);
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const topicData = yield topics_1.default.getTopicFields(tid, ['cid', 'pinned']);
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            postData.cid = topicData.cid;
            yield Promise.all([
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                database_1.default.sortedSetAdd('posts:pid', timestamp, postData.pid),
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                database_1.default.incrObjectField('global', 'postCount'),
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                user_1.default.onNewPostMade(postData),
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                topics_1.default.onNewPostMade(postData),
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                categories_1.default.onNewPostMade(topicData.cid, topicData.pinned, postData),
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                groups_1.default.onNewPostMade(postData),
                // The next line calls a function in a module that has not been updated to TS yet
                addReplyTo(postData, timestamp),
                Posts.uploads.sync(postData.pid),
            ]);
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            result = (yield plugins_1.default.hooks.fire('filter:post.get', {
                post: postData,
                uid,
            }));
            result.post.isMain = isMain;
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield plugins_1.default.hooks.fire('action:post.save', {
                post: lodash_1.default.clone(result.post),
            });
            return result.post;
        });
    };
}
exports.default = default_1;
