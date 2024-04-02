'use strict';

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
    const params = new URLSearchParams();
    params.set('content', postData.content);
    const response = await fetch(`${process.env.TRANSLATOR_API}/?${params.toString()}`);
    const data = await response.json();
    return [data.is_english, data.translated_content];
};
