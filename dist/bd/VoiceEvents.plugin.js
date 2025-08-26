/**
 * @name VoiceEvents
 * @version 2.7.0
 * @author Zerthox
 * @authorLink https://github.com/Zerthox
 * @description Adds TTS Event Notifications to your selected Voice Channel. TeamSpeak feeling.
 * @website https://github.com/Zerthox/BetterDiscord-Plugins
 * @source https://github.com/Zerthox/BetterDiscord-Plugins/tree/master/src/VoiceEvents
**/

/*@cc_on @if (@_jscript)
var pluginName = WScript.ScriptName.split(".")[0];
var shell = WScript.CreateObject("WScript.Shell");
shell.Popup(
    "Do NOT run scripts from the internet with the Windows Script Host!\nMove this file to your BetterDiscord plugins folder.",
    0,
    pluginName + ": Warning!",
    0x1030
);
var fso = new ActiveXObject("Scripting.FileSystemObject");
var pluginsPath = shell.expandEnvironmentStrings("%appdata%\\BetterDiscord\\plugins");
if (!fso.FolderExists(pluginsPath)) {
    var popup = shell.Popup(
        "Unable to find BetterDiscord on your computer.\nOpen the download page of BetterDiscord?",
        0,
        pluginName + ": BetterDiscord not found",
        0x34
    );
    if (popup === 6) {
        shell.Exec("explorer \"https://betterdiscord.app\"");
    }
} else if (WScript.ScriptFullName === pluginsPath + "\\" + WScript.ScriptName) {
    shell.Popup(
        "This plugin is already in the correct folder.\nNavigate to the \"Plugins\" settings tab in Discord and enable it there.",
        0,
        pluginName,
        0x40
    );
} else {
    var popup = shell.Popup(
        "Open the BetterDiscord plugins folder?",
        0,
        pluginName,
        0x34
    );
    if (popup === 6) {
        shell.Exec("explorer " + pluginsPath);
    }
}
WScript.Quit();
@else @*/

'use strict';

let meta = null;
const getMeta = () => {
    if (meta) {
        return meta;
    }
    else {
        throw Error("Accessing meta before initialization");
    }
};
const setMeta = (newMeta) => {
    meta = newMeta;
};

const load = (key) => BdApi.Data.load(getMeta().name, key);
const save = (key, value) => BdApi.Data.save(getMeta().name, key, value);

const checkObjectValues = (target) => target !== window && target instanceof Object && target.constructor?.prototype !== target;
const byName$1 = (name) => {
    return (target) => (target?.displayName ?? target?.constructor?.displayName) === name;
};
const byKeys$1 = (...keys) => {
    return (target) => target instanceof Object && keys.every((key) => key in target);
};
const bySource$1 = (...fragments) => {
    return (target) => {
        while (target instanceof Object && "$$typeof" in target) {
            target = target.render ?? target.type;
        }
        if (target instanceof Function) {
            const source = target.toString();
            const renderSource = target.prototype?.render?.toString();
            return fragments.every((fragment) => typeof fragment === "string" ? (source.includes(fragment) || renderSource?.includes(fragment)) : (fragment(source) || renderSource && fragment(renderSource)));
        }
        else {
            return false;
        }
    };
};

const alert = (title, content) => BdApi.UI.alert(title, content);
const confirm = (title, content, options = {}) => BdApi.UI.showConfirmationModal(title, content, options);
const mappedProxy = (target, mapping) => {
    const map = new Map(Object.entries(mapping));
    return new Proxy(target, {
        get(target, prop) {
            return target[map.get(prop) ?? prop];
        },
        set(target, prop, value) {
            target[map.get(prop) ?? prop] = value;
            return true;
        },
        deleteProperty(target, prop) {
            delete target[map.get(prop) ?? prop];
            map.delete(prop);
            return true;
        },
        has(target, prop) {
            return map.has(prop) || prop in target;
        },
        ownKeys() {
            return [...map.keys(), ...Object.keys(target)];
        },
        getOwnPropertyDescriptor(target, prop) {
            return Object.getOwnPropertyDescriptor(target, map.get(prop) ?? prop);
        },
        defineProperty(target, prop, attributes) {
            Object.defineProperty(target, map.get(prop) ?? prop, attributes);
            return true;
        }
    });
};

const find = (filter, { resolve = true, entries = false } = {}) => BdApi.Webpack.getModule(filter, {
    defaultExport: resolve,
    searchExports: entries
});
const byName = (name, options) => find(byName$1(name), options);
const byKeys = (keys, options) => find(byKeys$1(...keys), options);
const bySource = (contents, options) => find(bySource$1(...contents), options);
const demangle = (mapping, required, proxy = false) => {
    const req = required ?? Object.keys(mapping);
    const found = find((target) => (checkObjectValues(target)
        && req.every((req) => Object.values(target).some((value) => mapping[req](value)))));
    return proxy ? mappedProxy(found, Object.fromEntries(Object.entries(mapping).map(([key, filter]) => [
        key,
        Object.entries(found ?? {}).find(([, value]) => filter(value))?.[0]
    ]))) : Object.fromEntries(Object.entries(mapping).map(([key, filter]) => [
        key,
        Object.values(found ?? {}).find((value) => filter(value))
    ]));
};
let controller = new AbortController();
const abort = () => {
    controller.abort();
    controller = new AbortController();
};

const COLOR = "#3a71c1";
const print = (output, ...data) => output(`%c[${getMeta().name}] %c${getMeta().version ? `(v${getMeta().version})` : ""}`, `color: ${COLOR}; font-weight: 700;`, "color: #666; font-size: .8em;", ...data);
const log = (...data) => print(console.log, ...data);
const warn = (...data) => print(console.warn, ...data);
const error = (...data) => print(console.error, ...data);

let menuPatches = [];
const contextMenu = (navId, callback, options = {}) => {
    const cancel = BdApi.ContextMenu.patch(navId, options.once ? (tree) => {
        const result = callback(tree);
        cancel();
        return result;
    } : callback);
    menuPatches.push(cancel);
    if (!options.silent) {
        log(`Patched ${options.name ?? `"${navId}"`} context menu`);
    }
    return cancel;
};
const unpatchAll = () => {
    if (menuPatches.length + BdApi.Patcher.getPatchesByCaller(getMeta().name).length > 0) {
        for (const cancel of menuPatches) {
            cancel();
        }
        menuPatches = [];
        BdApi.Patcher.unpatchAll(getMeta().name);
        log("Unpatched all");
    }
};

const inject = (styles) => {
    if (typeof styles === "string") {
        BdApi.DOM.addStyle(getMeta().name, styles);
    }
};
const clear = () => BdApi.DOM.removeStyle(getMeta().name);

const ChannelStore = /* @__PURE__ */ byName("ChannelStore");
const SelectedChannelStore = /* @__PURE__ */ byName("SelectedChannelStore");
const VoiceStateStore = /* @__PURE__ */ byName("VoiceStateStore");

const Dispatcher = /* @__PURE__ */ byKeys(["dispatch", "subscribe"]);

const GuildMemberStore = /* @__PURE__ */ byName("GuildMemberStore");

const MediaEngineStore = /* @__PURE__ */ byName("MediaEngineStore");

const { React } = BdApi;
const classNames = /* @__PURE__ */ find((exports) => exports instanceof Object && exports.default === exports && Object.keys(exports).length === 1);

const UserStore = /* @__PURE__ */ byName("UserStore");

const Button = /* @__PURE__ */ byKeys(["Colors", "Link"], { entries: true });

const Flex = /* @__PURE__ */ byKeys(["Child", "Justify", "Align"], { entries: true });

const { FormSection, FormItem, FormTitle, FormText,
FormDivider, FormSwitch} = /* @__PURE__ */ demangle({
    FormSection: bySource$1("titleClassName:", ".sectionTitle"),
    FormItem: bySource$1("titleClassName:", "required:"),
    FormTitle: bySource$1("faded:", "required:"),
    FormText: (target) => target.Types?.INPUT_PLACEHOLDER,
    FormDivider: bySource$1(".divider", "style:"),
    FormSwitch: bySource$1("tooltipNote:"),
    FormNotice: bySource$1("imageData:", ".formNotice")
}, ["FormSection", "FormItem", "FormDivider"]);

const margins = /* @__PURE__ */ byKeys(["marginBottom40", "marginTop4"]);

const { Item: MenuItem} = BdApi.ContextMenu;

const { SingleSelect } =  demangle({
    Select: bySource$1("renderOptionLabel:", "renderOptionValue:", "popoutWidth:"),
    SingleSelect: bySource$1((source) => /{value:[a-zA-Z_$],onChange:[a-zA-Z_$]}/.test(source))
}, ["Select"]);

const Slider = /* @__PURE__ */ bySource(["markerPositions:", "asValueChanges:"], { entries: true });

const Switch = /* @__PURE__ */ bySource(["checked:", "reducedMotion:"], { entries: true });

const TextInput = /* @__PURE__ */ bySource(["placeholder", "maxLength", "clearable"], { entries: true });

const Text = /* @__PURE__ */ bySource(["lineClamp:", "variant:", "tabularNumbers:"], { entries: true });

const queryTree = (node, predicate) => {
    const worklist = [node].flat();
    while (worklist.length !== 0) {
        const node = worklist.shift();
        if (React.isValidElement(node)) {
            if (predicate(node)) {
                return node;
            }
            const children = node?.props?.children;
            if (children) {
                worklist.push(...[children].flat());
            }
        }
    }
    return null;
};
const queryTreeForParent = (tree, predicate) => {
    let childIndex = -1;
    const parent = queryTree(tree, (node) => {
        const children = node?.props?.children;
        if (children instanceof Array) {
            const index = children.findIndex(predicate);
            if (index > -1) {
                childIndex = index;
                return true;
            }
        }
    });
    return [parent, childIndex];
};

const SettingsContainer = ({ name, children, onReset }) => (React.createElement(FormSection, null,
    children,
    onReset ? (React.createElement(React.Fragment, null,
        React.createElement(FormDivider, { className: classNames(margins.marginTop20, margins.marginBottom20) }),
        React.createElement(Flex, { justify: Flex.Justify.END },
            React.createElement(Button, { size: Button.Sizes.SMALL, onClick: () => confirm(name, "Reset all settings?", {
                    onConfirm: () => onReset()
                }) }, "Reset")))) : null));

class SettingsStore {
    constructor(defaults, onLoad) {
        this.listeners = new Set();
        this.getCurrent = () => this.current;
        this.update = (settings) => {
            const update = typeof settings === "function" ? settings(this.current) : settings;
            this.current = { ...this.current, ...update };
            this._dispatch(true);
        };
        this.addListenerEffect = (listener) => {
            this.addListener(listener);
            return () => this.removeListener(listener);
        };
        this.addReactChangeListener = this.addListener;
        this.removeReactChangeListener = this.removeListener;
        this.defaults = defaults;
        this.onLoad = onLoad;
    }
    load() {
        this.current = { ...this.defaults, ...load("settings") };
        this.onLoad?.();
        this._dispatch(false);
    }
    _dispatch(save$1) {
        for (const listener of this.listeners) {
            listener(this.current);
        }
        if (save$1) {
            save("settings", this.current);
        }
    }
    reset() {
        this.current = { ...this.defaults };
        this._dispatch(true);
    }
    delete(...keys) {
        this.current = { ...this.current };
        for (const key of keys) {
            delete this.current[key];
        }
        this._dispatch(true);
    }
    useCurrent() {
        return React.useSyncExternalStore(this.addListenerEffect, this.getCurrent);
    }
    useSelector(selector, deps = null, compare = Object.is) {
        const state = React.useRef(null);
        const snapshot = React.useCallback(() => {
            const next = selector(this.current);
            if (!compare(state.current, next)) {
                state.current = next;
            }
            return state.current;
        }, deps ?? [selector]);
        return React.useSyncExternalStore(this.addListenerEffect, snapshot);
    }
    useState() {
        const current = this.useCurrent();
        return [current, this.update];
    }
    useStateWithDefaults() {
        const current = this.useCurrent();
        return [current, this.defaults, this.update];
    }
    useListener(listener, deps) {
        React.useEffect(() => this.addListenerEffect(listener), deps ?? [listener]);
    }
    addListener(listener) {
        this.listeners.add(listener);
        return listener;
    }
    removeListener(listener) {
        this.listeners.delete(listener);
    }
    removeAllListeners() {
        this.listeners.clear();
    }
}
const createSettings = (defaults, onLoad) => new SettingsStore(defaults, onLoad);

const createPlugin = (plugin) => (meta) => {
    setMeta(meta);
    const { start, stop, styles, Settings, SettingsPanel } = (plugin instanceof Function ? plugin(meta) : plugin);
    Settings?.load();
    return {
        start() {
            log("Enabled");
            inject(styles);
            start?.();
        },
        stop() {
            abort();
            unpatchAll();
            clear();
            stop?.();
            log("Disabled");
        },
        getSettingsPanel: SettingsPanel ? () => (React.createElement(SettingsContainer, { name: meta.name, onReset: Settings ? () => Settings.reset() : null },
            React.createElement(SettingsPanel, null))) : null
    };
};

const Settings = createSettings({
    voice: null,
    volume: 100,
    speed: 1,
    filterNames: true,
    filterBots: false,
    filterStages: true,
    notifs: {
        mute: {
            enabled: true,
            message: "Muted"
        },
        unmute: {
            enabled: true,
            message: "Unmuted"
        },
        deafen: {
            enabled: true,
            message: "Deafened"
        },
        undeafen: {
            enabled: true,
            message: "Undeafened"
        },
        join: {
            enabled: true,
            message: "$user joined $channel"
        },
        leave: {
            enabled: true,
            message: "$user left $channel"
        },
        joinSelf: {
            enabled: true,
            message: "You joined $channel"
        },
        moveSelf: {
            enabled: true,
            message: "You were moved to $channel"
        },
        leaveSelf: {
            enabled: true,
            message: "You left $channel"
        }
    },
    unknownChannel: "The call"
});

const findDefaultVoice = () => {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        error("No speech synthesis voices available");
        alert(getMeta().name, React.createElement(Text, { color: "text-normal" },
            "Electron does not have any Speech Synthesis Voices available on your system.",
            React.createElement("br", null),
            "The plugin will be unable to function properly."));
        return null;
    }
    else {
        return voices.find((voice) => voice.lang === "en-US") ?? voices[0];
    }
};
const findCurrentVoice = () => {
    const uri = Settings.current.voice;
    const voice = speechSynthesis.getVoices().find((voice) => voice.voiceURI === uri);
    if (voice) {
        return voice;
    }
    else {
        warn(`Voice "${uri}" not found, reverting to default`);
        const defaultVoice = findDefaultVoice();
        Settings.update({ voice: defaultVoice.voiceURI });
        return defaultVoice;
    }
};
const speak = (message) => {
    const { volume, speed } = Settings.current;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.voice = findCurrentVoice();
    utterance.volume = volume / 100;
    utterance.rate = speed;
    speechSynthesis.speak(utterance);
};
const processName = (name) => {
    return Settings.current.filterNames ? name.split("").map((char) => /[a-zA-Z0-9]/.test(char) ? char : " ").join("") : name;
};
const notify = (type, userId, channelId) => {
    const settings = Settings.current;
    const notif = settings.notifs[type];
    if (!notif.enabled) {
        return;
    }
    const user = UserStore.getUser(userId);
    const channel = ChannelStore.getChannel(channelId);
    if (settings.filterBots && user?.bot
        || settings.filterStages && channel?.isGuildStageVoice()) {
        return;
    }
    const displayName = user.globalName ?? user.username;
    const nick = GuildMemberStore.getMember(channel?.getGuildId(), userId)?.nick ?? displayName;
    const channelName = (!channel || channel.isDM() || channel.isGroupDM()) ? settings.unknownChannel : channel.name;
    const message = notif.message
        .replaceAll("$username", processName(user.username))
        .replaceAll("$displayname", processName(user.username))
        .replaceAll("$user", processName(nick))
        .replaceAll("$channel", processName(channelName));
    speak(message);
};

const titles = {
    mute: "Mute (Self)",
    unmute: "Unmute (Self)",
    deafen: "Deafen (Self)",
    undeafen: "Undeafen (Self)",
    join: "Join (Other Users)",
    leave: "Leave (Other Users)",
    joinSelf: "Join (Self)",
    moveSelf: "Move (Self)",
    leaveSelf: "Leave (Self)"
};
const VoiceLabel = ({ name, lang }) => (React.createElement(Flex, { direction: Flex.Direction.HORIZONTAL, align: Flex.Align.CENTER },
    React.createElement(Text, { variant: "text-md/normal" }, name),
    React.createElement(Text, { variant: "text-xs/semibold", style: { marginLeft: 8 } }, lang)));
const SettingsPanel = () => {
    const [{ voice, volume, speed, filterNames, filterBots, filterStages, ...settings }, defaults, setSettings] = Settings.useStateWithDefaults();
    return (React.createElement(React.Fragment, null,
        React.createElement(FormItem, { className: margins.marginBottom20 },
            React.createElement(FormTitle, null, "TTS Voice"),
            React.createElement(SingleSelect, { value: voice, options: speechSynthesis.getVoices().map(({ name, lang, voiceURI }) => ({
                    value: voiceURI,
                    label: name,
                    lang
                })), onChange: (value) => setSettings({ voice: value }), renderOptionLabel: ({ label, lang }) => React.createElement(VoiceLabel, { name: label, lang: lang }), renderOptionValue: ([{ label, lang }]) => React.createElement(VoiceLabel, { name: label, lang: lang }) })),
        React.createElement(FormItem, { className: margins.marginBottom20 },
            React.createElement(FormTitle, null, "TTS Volume"),
            React.createElement(Slider, { initialValue: volume, maxValue: 100, minValue: 0, asValueChanges: (value) => setSettings({ volume: value }) })),
        React.createElement(FormItem, { className: margins.marginBottom20 },
            React.createElement(FormTitle, null, "TTS Speed"),
            React.createElement(Slider, { initialValue: speed, maxValue: 10, minValue: 0.1, asValueChanges: (value) => setSettings({ speed: value }), onValueRender: (value) => `${value.toFixed(2)}x`, markers: [0.1, 1, 2, 5, 10], onMarkerRender: (value) => `${value.toFixed(2)}x` })),
        React.createElement(FormDivider, { className: classNames(margins.marginTop20, margins.marginBottom20) }),
        React.createElement(FormItem, null,
            React.createElement(FormSwitch, { value: filterNames, onChange: (checked) => setSettings({ filterNames: checked }), note: "Limit user & channel names to alphanumeric characters." }, "Enable Name Filter")),
        React.createElement(FormItem, null,
            React.createElement(FormSwitch, { value: filterBots, onChange: (checked) => setSettings({ filterBots: checked }), note: "Disable notifications for bot users in voice." }, "Enable Bot Filter")),
        React.createElement(FormItem, null,
            React.createElement(FormSwitch, { value: filterStages, onChange: (checked) => setSettings({ filterStages: checked }), note: "Disable notifications for stage voice channels." }, "Enable Stage Filter")),
        React.createElement(FormSection, null,
            React.createElement(FormTitle, { tag: "h3" }, "Notifications"),
            React.createElement(FormText, { type: "description", className: margins.marginBottom20 },
                React.createElement(Text, { tag: "span", variant: "code" }, "$user"),
                " will get replaced with the respective User Nickname, ",
                React.createElement(Text, { tag: "span", variant: "code" }, "$displayname"),
                " with the global User Display Name, ",
                React.createElement(Text, { tag: "span", variant: "code" }, "$username"),
                " with the User Account name and ",
                React.createElement(Text, { tag: "span", variant: "code" }, "$channel"),
                " with the respective Voice Channel name."),
            Object.entries(titles).map(([key, title]) => (React.createElement(FormItem, { key: key, className: margins.marginBottom20 },
                React.createElement(FormTitle, null, title),
                React.createElement(Flex, { align: Flex.Align.CENTER },
                    React.createElement(Flex.Child, { grow: 1 },
                        React.createElement("div", null,
                            React.createElement(TextInput, { value: settings.notifs[key].message, placeholder: defaults.notifs[key].message, onChange: (value) => {
                                    const { notifs } = settings;
                                    notifs[key].message = value;
                                    setSettings({ notifs });
                                } }))),
                    React.createElement(Flex.Child, { grow: 0 },
                        React.createElement("div", null,
                            React.createElement(Switch, { checked: settings.notifs[key].enabled, onChange: (value) => {
                                    const { notifs } = settings;
                                    notifs[key].enabled = value;
                                    setSettings({ notifs });
                                } }))),
                    React.createElement(Flex.Child, { grow: 0 },
                        React.createElement("div", null,
                            React.createElement(Button, { size: Button.Sizes.SMALL, onClick: () => speak(settings.notifs[key].message
                                    .split("$user").join("user")
                                    .split("$channel").join("channel")) }, "Test"))))))),
            React.createElement(FormItem, { key: "unknownChannel", className: margins.marginBottom20 },
                React.createElement(FormTitle, null, "Unknown Channel Name"),
                React.createElement(Flex, { align: Flex.Align.CENTER },
                    React.createElement(Flex.Child, { grow: 1 },
                        React.createElement("div", null,
                            React.createElement(TextInput, { value: settings.unknownChannel, placeholder: defaults.unknownChannel, onChange: (value) => setSettings({ unknownChannel: value }) }))),
                    React.createElement(Flex.Child, { grow: 0 },
                        React.createElement(Button, { size: Button.Sizes.SMALL, onClick: () => speak(settings.unknownChannel) }, "Test")))))));
};

const selfMuteHandler = () => {
    const userId = UserStore.getCurrentUser().id;
    const channelId = SelectedChannelStore.getVoiceChannelId();
    notify(MediaEngineStore.isSelfMute() ? "mute" : "unmute", userId, channelId);
};
const selfDeafHandler = () => {
    const userId = UserStore.getCurrentUser().id;
    const channelId = SelectedChannelStore.getVoiceChannelId();
    notify(MediaEngineStore.isSelfDeaf() ? "deafen" : "undeafen", userId, channelId);
};
let prevStates = {};
const saveStates = () => {
    prevStates = { ...VoiceStateStore.getVoiceStatesForChannel(SelectedChannelStore.getVoiceChannelId()) };
};
const voiceStateHandler = (action) => {
    for (const { userId, channelId } of action.voiceStates) {
        try {
            const prev = prevStates[userId];
            if (userId === UserStore.getCurrentUser().id) {
                if (!channelId) {
                    notify("leaveSelf", userId, prev.channelId);
                    saveStates();
                }
                else if (!prev) {
                    notify("joinSelf", userId, channelId);
                    saveStates();
                }
                else if (channelId !== prev.channelId) {
                    notify("moveSelf", userId, channelId);
                    saveStates();
                }
            }
            else {
                const selectedChannelId = SelectedChannelStore.getVoiceChannelId();
                if (!selectedChannelId) {
                    return;
                }
                if (!prev && channelId === selectedChannelId) {
                    notify("join", userId, channelId);
                    saveStates();
                }
                else if (prev && !VoiceStateStore.getVoiceStatesForChannel(selectedChannelId)[userId]) {
                    notify("leave", userId, selectedChannelId);
                    saveStates();
                }
            }
        }
        catch (error$1) {
            error("Error processing voice state change, see details below");
            console.error(error$1);
        }
    }
};
const index = createPlugin({
    start() {
        const voice = findDefaultVoice()?.voiceURI;
        Settings.defaults.voice = voice;
        if (!Settings.current.voice) {
            Settings.update({ voice });
        }
        saveStates();
        Dispatcher.subscribe("VOICE_STATE_UPDATES", voiceStateHandler);
        log("Subscribed to voice state actions");
        Dispatcher.subscribe("AUDIO_TOGGLE_SELF_MUTE", selfMuteHandler);
        log("Subscribed to self mute actions");
        Dispatcher.subscribe("AUDIO_TOGGLE_SELF_DEAF", selfDeafHandler);
        log("Subscribed to self deaf actions");
        contextMenu("channel-context", (result) => {
            const [parent, index] = queryTreeForParent(result, (child) => child?.props?.id === "hide-voice-names");
            if (parent) {
                parent.props.children.splice(index + 1, 0, (React.createElement(MenuItem, { isFocused: false, id: "voiceevents-clear", label: "Clear VoiceEvents queue", action: () => speechSynthesis.cancel() })));
            }
        });
    },
    stop() {
        prevStates = {};
        Dispatcher.unsubscribe("VOICE_STATE_UPDATES", voiceStateHandler);
        log("Unsubscribed from voice state actions");
        Dispatcher.unsubscribe("AUDIO_TOGGLE_SELF_MUTE", selfMuteHandler);
        log("Unsubscribed from self mute actions");
        Dispatcher.unsubscribe("AUDIO_TOGGLE_SELF_DEAF", selfDeafHandler);
        log("Unsubscribed from self deaf actions");
    },
    Settings,
    SettingsPanel
});

module.exports = index;

/*@end @*/
