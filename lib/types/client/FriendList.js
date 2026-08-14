import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * The WeChat-like friend list, occupying the layout's `'sidebar'` slot. Shows
 * every girlfriend character with portrait + last message + time; left click
 * opens the chat, right click opens a small character-settings menu. The
 * bottom row carries the settings gear (左下角设置) and the top row the
 * add-friend button. Everything arrives through the shared `useModel` hook.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTime } from "./types.js";
import { assetUrl } from "./host-api.js";
import css from './FriendList.module.css';
function Avatar(props) {
    const { character } = props;
    const size = props.size ?? 44;
    if (character.avatarPath !== undefined) {
        return (_jsx("img", { className: css.avatarImg, style: { width: size, height: size }, src: assetUrl(character.avatarPath), alt: character.name, draggable: false }));
    }
    return (_jsx("div", { className: css.avatarFallback, style: { width: size, height: size, fontSize: size * 0.42 }, children: character.name.slice(0, 1) }));
}
export function FriendList(props) {
    const { useModel, actions, collapsed } = props;
    const characters = useModel(s => s.characters);
    const view = useModel(s => s.view);
    const [menu, setMenu] = useState(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const menuRef = useRef(null);
    const closeMenu = useCallback(() => {
        setMenu(null);
        setConfirmingDelete(false);
    }, []);
    useEffect(() => {
        if (menu === null)
            return;
        const onDown = (event) => {
            if (menuRef.current === null || !menuRef.current.contains(event.target))
                closeMenu();
        };
        window.addEventListener('mousedown', onDown);
        return () => window.removeEventListener('mousedown', onDown);
    }, [menu, closeMenu]);
    const onContextMenu = useCallback((event, character) => {
        event.preventDefault();
        setConfirmingDelete(false);
        setMenu({ x: event.clientX, y: event.clientY, character });
    }, []);
    return (_jsxs("div", { className: css.root, "data-collapsed": collapsed || undefined, children: [collapsed ? (_jsxs("div", { className: css.rail, children: [_jsx("button", { type: "button", className: css.railButton, title: "\u6DFB\u52A0\u597D\u53CB", onClick: () => actions.openCreate(), children: "\uFF0B" }), _jsx("button", { type: "button", className: css.railButton, title: "\u8BBE\u7F6E\uFF08\u5BF9\u8BDD / \u89C6\u89C9 / \u6587\u751F\u56FE / \u6587\u751F\u89C6\u9891 API\uFF09", onClick: () => actions.openSettings(), children: "\u2699" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: css.header, children: [_jsx("span", { className: css.title, children: "\u6211\u7684\u5973\u53CB" }), _jsx("button", { className: css.addButton, type: "button", title: "\u6DFB\u52A0\u597D\u53CB", onClick: () => actions.openCreate(), children: "\uFF0B" })] }), characters.length === 0 ? (_jsxs("div", { className: css.empty, children: [_jsx("div", { className: css.emptyEmoji, children: "\uD83D\uDC96" }), _jsx("div", { className: css.emptyText, children: "\u8FD8\u6CA1\u6709\u597D\u53CB" }), _jsx("button", { className: css.emptyAction, type: "button", onClick: () => actions.openCreate(), children: "\u70B9\u8FD9\u91CC\u6DFB\u52A0\u4F60\u7684\u7B2C\u4E00\u4F4D\u5973\u53CB" })] })) : (_jsx("ul", { className: css.list, children: characters.map(character => {
                            const active = view.kind === 'chat' && view.characterId === character.id;
                            return (_jsx("li", { children: _jsxs("button", { type: "button", className: css.item, "data-active": active || undefined, onClick: () => actions.openChat(character.id), onContextMenu: event => onContextMenu(event, character), children: [_jsx(Avatar, { character: character }), _jsxs("span", { className: css.itemBody, children: [_jsxs("span", { className: css.itemRow, children: [_jsx("span", { className: css.name, children: character.name }), _jsx("span", { className: css.time, children: formatTime(character.lastTime) })] }), _jsx("span", { className: css.preview, children: character.lastMessage })] })] }) }, character.id));
                        }) })), _jsx("div", { className: css.footer, children: _jsxs("button", { type: "button", className: css.gear, title: "\u7CFB\u7EDF\u8BBE\u7F6E\uFF08\u5BF9\u8BDD / \u89C6\u89C9 / \u6587\u751F\u56FE / \u6587\u751F\u89C6\u9891 API\uFF09", onClick: () => actions.openSettings(), children: [_jsx("span", { className: css.gearIcon, "aria-hidden": true, children: "\u2699" }), _jsx("span", { className: css.gearLabel, children: "\u7CFB\u7EDF\u8BBE\u7F6E" })] }) })] })), menu !== null && (_jsxs("div", { ref: menuRef, className: css.menu, style: { left: menu.x, top: menu.y }, children: [_jsx("button", { type: "button", className: css.menuItem, onClick: () => {
                            actions.openEdit(menu.character.id);
                            closeMenu();
                        }, children: "\u7F16\u8F91\u4EBA\u7269\u8BBE\u5B9A" }), _jsx("button", { type: "button", className: `${css.menuItem} ${css.menuDanger}`, onClick: () => {
                            if (!confirmingDelete) {
                                setConfirmingDelete(true);
                                return;
                            }
                            void actions.deleteCharacter(menu.character.id);
                            closeMenu();
                        }, children: confirmingDelete ? '确认删除？再次点击确认' : '删除好友' })] }))] }));
}
//# sourceMappingURL=FriendList.js.map