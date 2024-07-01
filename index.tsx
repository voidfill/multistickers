/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import definePlugin from "@utils/types";

export default definePlugin({
    name: "multistickers",
    description: "lets you send up to 3 stickers and shift click stickers",
    authors: [
        {
            id: 579731384868798464n,
            name: "void",
        },
    ],
    patches: [{
        find: "StickerMessagePreviewStore",
        replacement: [{
            match: /ADD_STICKER_PREVIEW:function\((\w+).+?===(\w+\.\w+)\.FirstThreadMessage\?(\S+?):(\w+).+?\}/,
            replace: (_, event, constants, threadStore, store) => {
                return `ADD_STICKER_PREVIEW:function(${event}){` +
                    `const _c=${event}.channelId` +
                    `,_s=${event}.draftType===${constants}.FirstThreadMessage?${threadStore}:${store};` +
                    `_s[_c]=_s[_c]?.filter((_x)=>_x.id!==${event}.sticker.id);` +
                    "if(_s[_c]?.length===3){_s[_c].shift()};" +
                    `_s[_c]=[..._s[_c]??[],${event}.sticker]` +
                    "}";
            },
        },
        {
            match: /CLEAR_STICKER_PREVIEW:function\((\w+).+?(\w+\.\w+).FirstThreadMessage\?(\S+?):(\w+).+?\}/,
            replace: (_, event, constants, threadStore, store) => {
                return `CLEAR_STICKER_PREVIEW:function(${event}){` +
                    `const _c=${event}.channelId,` +
                    `_s=${event}.draftType===${constants}.FirstThreadMessage?${threadStore}:${store};` +
                    `if(${event}.stickerId){_s[_c]=_s[_c]?.filter((_x)=>_x.id!==${event}.stickerId);return;}` +
                    "null!=_s[_c]&&delete _s[_c]" +
                    "}";
            }
        }],
    },
    {
        find: ".stickerPreviewContainer",
        replacement: {
            match: /(?<=\.closeButton,.+?\}\),onClick:\(\)=>)\(0,(.+?)\)\((\w+),(\w+\.\w+\.\w+)\)/,
            replace: (_, clear, channelId, type) => {
                return `(0,${clear})(${channelId},${type},e.id)`; // i really really dont want to match the entire map function, e is almost always react props
            }
        }
    },
    {
        find: "type:\"CLEAR_STICKER_PREVIEW\",channelId:",
        replacement: {
            match: /function (\w+)\(\w+,\w+\)\{(\w+\.\w+)\.dispatch.+?\}\)\}/,
            replace: (_, name, Dispatch) => {
                return `function ${name}(_c, _t, _s){` +
                    `${Dispatch}.dispatch({type:"CLEAR_STICKER_PREVIEW",channelId:_c,draftType:_t,stickerId:_s})` +
                    "}";
            }
        }
    },
    {
        find: ".stickerInspected]",
        replacement: {
            match: /(?<=\.stickerInspected\])(.+?),onClick:(\w+)=>\{/,
            replace: (_, stuff, event) => {
                return `${stuff},onClick:${event}=>{` +
                    `if(${event}.shiftKey){Vencord.Plugins.plugins.multistickers.shiftEvent.set()};`;
            }
        }
    },
    {
        find: ".stickers,previewSticker:",
        replacement: {
            match: /(getUploadCount.+?0)/,
            replace: "$1||Vencord.Plugins.plugins.multistickers.shiftEvent.get(\"attach\")",
        }
    },
    {
        find: "name:\"expression-picker-last-active-view\"",
        replacement: {
            match: /(?=name:"expression-picker-last-active-view")(.+?=>.+?=>.+?=>\{)/,
            replace: "$1if(Vencord.Plugins.plugins.multistickers.shiftEvent.get(\"close\"))return;"
        }
    }],

    shiftEvent: {
        shouldNotClose: false,
        shouldAttach: false,
        set: function () {
            this.shouldNotClose = true;
            this.shouldAttach = true;
        },
        get(type) {
            let ret = false;
            switch (type) {
                case "attach":
                    ret = this.shouldAttach;
                    this.shouldAttach = false;
                    break;
                case "close":
                    ret = this.shouldNotClose;
                    this.shouldNotClose = false;
            }
            return ret;
        },
    },
});
