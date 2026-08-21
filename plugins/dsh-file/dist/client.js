window.__ModuleLoader__.load({
  id: "dsh-file",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/highlight.js/lib/core.js
var require_core = __commonJS({
  "node_modules/highlight.js/lib/core.js"(exports, module2) {
    function deepFreeze(obj) {
      if (obj instanceof Map) {
        obj.clear = obj.delete = obj.set = function() {
          throw new Error("map is read-only");
        };
      } else if (obj instanceof Set) {
        obj.add = obj.clear = obj.delete = function() {
          throw new Error("set is read-only");
        };
      }
      Object.freeze(obj);
      Object.getOwnPropertyNames(obj).forEach((name) => {
        const prop = obj[name];
        const type = typeof prop;
        if ((type === "object" || type === "function") && !Object.isFrozen(prop)) {
          deepFreeze(prop);
        }
      });
      return obj;
    }
    var Response = class {
      /**
       * @param {CompiledMode} mode
       */
      constructor(mode) {
        if (mode.data === void 0) mode.data = {};
        this.data = mode.data;
        this.isMatchIgnored = false;
      }
      ignoreMatch() {
        this.isMatchIgnored = true;
      }
    };
    function escapeHTML(value) {
      return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
    }
    function inherit$1(original, ...objects) {
      const result = /* @__PURE__ */ Object.create(null);
      for (const key in original) {
        result[key] = original[key];
      }
      objects.forEach(function(obj) {
        for (const key in obj) {
          result[key] = obj[key];
        }
      });
      return (
        /** @type {T} */
        result
      );
    }
    var SPAN_CLOSE = "</span>";
    var emitsWrappingTags = (node) => {
      return !!node.scope;
    };
    var scopeToCSSClass = (name, { prefix }) => {
      if (name.startsWith("language:")) {
        return name.replace("language:", "language-");
      }
      if (name.includes(".")) {
        const pieces = name.split(".");
        return [
          `${prefix}${pieces.shift()}`,
          ...pieces.map((x2, i) => `${x2}${"_".repeat(i + 1)}`)
        ].join(" ");
      }
      return `${prefix}${name}`;
    };
    var HTMLRenderer = class {
      /**
       * Creates a new HTMLRenderer
       *
       * @param {Tree} parseTree - the parse tree (must support `walk` API)
       * @param {{classPrefix: string}} options
       */
      constructor(parseTree, options) {
        this.buffer = "";
        this.classPrefix = options.classPrefix;
        parseTree.walk(this);
      }
      /**
       * Adds texts to the output stream
       *
       * @param {string} text */
      addText(text) {
        this.buffer += escapeHTML(text);
      }
      /**
       * Adds a node open to the output stream (if needed)
       *
       * @param {Node} node */
      openNode(node) {
        if (!emitsWrappingTags(node)) return;
        const className = scopeToCSSClass(
          node.scope,
          { prefix: this.classPrefix }
        );
        this.span(className);
      }
      /**
       * Adds a node close to the output stream (if needed)
       *
       * @param {Node} node */
      closeNode(node) {
        if (!emitsWrappingTags(node)) return;
        this.buffer += SPAN_CLOSE;
      }
      /**
       * returns the accumulated buffer
      */
      value() {
        return this.buffer;
      }
      // helpers
      /**
       * Builds a span element
       *
       * @param {string} className */
      span(className) {
        this.buffer += `<span class="${className}">`;
      }
    };
    var newNode = (opts = {}) => {
      const result = { children: [] };
      Object.assign(result, opts);
      return result;
    };
    var TokenTree = class _TokenTree {
      constructor() {
        this.rootNode = newNode();
        this.stack = [this.rootNode];
      }
      get top() {
        return this.stack[this.stack.length - 1];
      }
      get root() {
        return this.rootNode;
      }
      /** @param {Node} node */
      add(node) {
        this.top.children.push(node);
      }
      /** @param {string} scope */
      openNode(scope) {
        const node = newNode({ scope });
        this.add(node);
        this.stack.push(node);
      }
      closeNode() {
        if (this.stack.length > 1) {
          return this.stack.pop();
        }
        return void 0;
      }
      closeAllNodes() {
        while (this.closeNode()) ;
      }
      toJSON() {
        return JSON.stringify(this.rootNode, null, 4);
      }
      /**
       * @typedef { import("./html_renderer").Renderer } Renderer
       * @param {Renderer} builder
       */
      walk(builder) {
        return this.constructor._walk(builder, this.rootNode);
      }
      /**
       * @param {Renderer} builder
       * @param {Node} node
       */
      static _walk(builder, node) {
        if (typeof node === "string") {
          builder.addText(node);
        } else if (node.children) {
          builder.openNode(node);
          node.children.forEach((child) => this._walk(builder, child));
          builder.closeNode(node);
        }
        return builder;
      }
      /**
       * @param {Node} node
       */
      static _collapse(node) {
        if (typeof node === "string") return;
        if (!node.children) return;
        if (node.children.every((el) => typeof el === "string")) {
          node.children = [node.children.join("")];
        } else {
          node.children.forEach((child) => {
            _TokenTree._collapse(child);
          });
        }
      }
    };
    var TokenTreeEmitter = class extends TokenTree {
      /**
       * @param {*} options
       */
      constructor(options) {
        super();
        this.options = options;
      }
      /**
       * @param {string} text
       */
      addText(text) {
        if (text === "") {
          return;
        }
        this.add(text);
      }
      /** @param {string} scope */
      startScope(scope) {
        this.openNode(scope);
      }
      endScope() {
        this.closeNode();
      }
      /**
       * @param {Emitter & {root: DataNode}} emitter
       * @param {string} name
       */
      __addSublanguage(emitter, name) {
        const node = emitter.root;
        if (name) node.scope = `language:${name}`;
        this.add(node);
      }
      toHTML() {
        const renderer = new HTMLRenderer(this, this.options);
        return renderer.value();
      }
      finalize() {
        this.closeAllNodes();
        return true;
      }
    };
    function source(re) {
      if (!re) return null;
      if (typeof re === "string") return re;
      return re.source;
    }
    function lookahead(re) {
      return concat("(?=", re, ")");
    }
    function anyNumberOfTimes(re) {
      return concat("(?:", re, ")*");
    }
    function optional(re) {
      return concat("(?:", re, ")?");
    }
    function concat(...args) {
      const joined = args.map((x2) => source(x2)).join("");
      return joined;
    }
    function stripOptionsFromArgs(args) {
      const opts = args[args.length - 1];
      if (typeof opts === "object" && opts.constructor === Object) {
        args.splice(args.length - 1, 1);
        return opts;
      } else {
        return {};
      }
    }
    function either(...args) {
      const opts = stripOptionsFromArgs(args);
      const joined = "(" + (opts.capture ? "" : "?:") + args.map((x2) => source(x2)).join("|") + ")";
      return joined;
    }
    function countMatchGroups(re) {
      return new RegExp(re.toString() + "|").exec("").length - 1;
    }
    function startsWith(re, lexeme) {
      const match = re && re.exec(lexeme);
      return match && match.index === 0;
    }
    var BACKREF_RE = new RegExp(either(
      /\[(?:[^\\\]]|\\.)*\]/,
      // a character class, inside which ( and \ lose their meaning
      /\(\?<(?![=!])[^>]+>/,
      // a named capture group `(?<name>` (not a lookbehind `(?<=` / `(?<!`)
      /\(\?'[^']+'/,
      // a named capture group `(?'name'`
      /\(\??/,
      // an opening parenthesis, capturing or non-capturing / lookahead
      /\\([1-9][0-9]*)/,
      // a backreference like `\1`
      /\\./
      // any other escape sequence
    ));
    function _rewriteBackreferences(regexps, { joinWith }) {
      let numCaptures = 0;
      return regexps.map((regex) => {
        numCaptures += 1;
        const offset = numCaptures;
        let re = source(regex);
        let out = "";
        while (re.length > 0) {
          const match = BACKREF_RE.exec(re);
          if (!match) {
            out += re;
            break;
          }
          out += re.substring(0, match.index);
          re = re.substring(match.index + match[0].length);
          if (match[0][0] === "\\" && match[1]) {
            out += "\\" + String(Number(match[1]) + offset);
          } else {
            out += match[0];
            if (match[0] === "(" || /^\(\?[<']/.test(match[0])) {
              numCaptures++;
            }
          }
        }
        return out;
      }).map((re) => `(${re})`).join(joinWith);
    }
    var MATCH_NOTHING_RE = /\b\B/;
    var IDENT_RE = "[a-zA-Z]\\w*";
    var UNDERSCORE_IDENT_RE = "[a-zA-Z_]\\w*";
    var NUMBER_RE = "\\b\\d+(\\.\\d+)?";
    var C_NUMBER_RE = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)";
    var BINARY_NUMBER_RE = "\\b(0b[01]+)";
    var RE_STARTERS_RE = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~";
    var SHEBANG = (opts = {}) => {
      const beginShebang = /^#![ ]*\//;
      if (opts.binary) {
        opts.begin = concat(
          beginShebang,
          /.*\b/,
          opts.binary,
          /\b.*/
        );
      }
      return inherit$1({
        scope: "meta",
        begin: beginShebang,
        end: /$/,
        relevance: 0,
        /** @type {ModeCallback} */
        "on:begin": (m2, resp) => {
          if (m2.index !== 0) resp.ignoreMatch();
        }
      }, opts);
    };
    var BACKSLASH_ESCAPE = {
      begin: "\\\\[\\s\\S]",
      relevance: 0
    };
    var APOS_STRING_MODE = {
      scope: "string",
      begin: "'",
      end: "'",
      illegal: "\\n",
      contains: [BACKSLASH_ESCAPE]
    };
    var QUOTE_STRING_MODE = {
      scope: "string",
      begin: '"',
      end: '"',
      illegal: "\\n",
      contains: [BACKSLASH_ESCAPE]
    };
    var PHRASAL_WORDS_MODE = {
      begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
    };
    var COMMENT = function(begin, end, modeOptions = {}) {
      const mode = inherit$1(
        {
          scope: "comment",
          begin,
          end,
          contains: []
        },
        modeOptions
      );
      mode.contains.push({
        scope: "doctag",
        // hack to avoid the space from being included. the space is necessary to
        // match here to prevent the plain text rule below from gobbling up doctags
        begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
        end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
        excludeBegin: true,
        relevance: 0
      });
      const ENGLISH_WORD = either(
        // list of common 1 and 2 letter words in English
        "I",
        "a",
        "is",
        "so",
        "us",
        "to",
        "at",
        "if",
        "in",
        "it",
        "on",
        // note: this is not an exhaustive list of contractions, just popular ones
        /[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
        // contractions - can't we'd they're let's, etc
        /[A-Za-z]+[-][a-z]+/,
        // `no-way`, etc.
        /[A-Za-z][a-z]{2,}/
        // allow capitalized words at beginning of sentences
      );
      mode.contains.push(
        {
          // TODO: how to include ", (, ) without breaking grammars that use these for
          // comment delimiters?
          // begin: /[ ]+([()"]?([A-Za-z'-]{3,}|is|a|I|so|us|[tT][oO]|at|if|in|it|on)[.]?[()":]?([.][ ]|[ ]|\))){3}/
          // ---
          // this tries to find sequences of 3 english words in a row (without any
          // "programming" type syntax) this gives us a strong signal that we've
          // TRULY found a comment - vs perhaps scanning with the wrong language.
          // It's possible to find something that LOOKS like the start of the
          // comment - but then if there is no readable text - good chance it is a
          // false match and not a comment.
          //
          // for a visual example please see:
          // https://github.com/highlightjs/highlight.js/issues/2827
          begin: concat(
            /[ ]+/,
            // necessary to prevent us gobbling up doctags like /* @author Bob Mcgill */
            "(",
            ENGLISH_WORD,
            /[.]?[:]?([.][ ]|[ ])/,
            "){3}"
          )
          // look for 3 words in a row
        }
      );
      return mode;
    };
    var C_LINE_COMMENT_MODE = COMMENT("//", "$");
    var C_BLOCK_COMMENT_MODE = COMMENT("/\\*", "\\*/");
    var HASH_COMMENT_MODE = COMMENT("#", "$");
    var NUMBER_MODE = {
      scope: "number",
      begin: NUMBER_RE,
      relevance: 0
    };
    var C_NUMBER_MODE = {
      scope: "number",
      begin: C_NUMBER_RE,
      relevance: 0
    };
    var BINARY_NUMBER_MODE = {
      scope: "number",
      begin: BINARY_NUMBER_RE,
      relevance: 0
    };
    var REGEXP_MODE = {
      scope: "regexp",
      begin: /\/(?=[^/\n]*\/)/,
      end: /\/[gimuy]*/,
      contains: [
        BACKSLASH_ESCAPE,
        {
          begin: /\[/,
          end: /\]/,
          relevance: 0,
          contains: [BACKSLASH_ESCAPE]
        }
      ]
    };
    var TITLE_MODE = {
      scope: "title",
      begin: IDENT_RE,
      relevance: 0
    };
    var UNDERSCORE_TITLE_MODE = {
      scope: "title",
      begin: UNDERSCORE_IDENT_RE,
      relevance: 0
    };
    var METHOD_GUARD = {
      // excludes method names from keyword processing
      begin: "\\.\\s*" + UNDERSCORE_IDENT_RE,
      relevance: 0
    };
    var END_SAME_AS_BEGIN = function(mode) {
      return Object.assign(
        mode,
        {
          /** @type {ModeCallback} */
          "on:begin": (m2, resp) => {
            resp.data._beginMatch = m2[1];
          },
          /** @type {ModeCallback} */
          "on:end": (m2, resp) => {
            if (resp.data._beginMatch !== m2[1]) resp.ignoreMatch();
          }
        }
      );
    };
    var MODES = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      APOS_STRING_MODE,
      BACKSLASH_ESCAPE,
      BINARY_NUMBER_MODE,
      BINARY_NUMBER_RE,
      COMMENT,
      C_BLOCK_COMMENT_MODE,
      C_LINE_COMMENT_MODE,
      C_NUMBER_MODE,
      C_NUMBER_RE,
      END_SAME_AS_BEGIN,
      HASH_COMMENT_MODE,
      IDENT_RE,
      MATCH_NOTHING_RE,
      METHOD_GUARD,
      NUMBER_MODE,
      NUMBER_RE,
      PHRASAL_WORDS_MODE,
      QUOTE_STRING_MODE,
      REGEXP_MODE,
      RE_STARTERS_RE,
      SHEBANG,
      TITLE_MODE,
      UNDERSCORE_IDENT_RE,
      UNDERSCORE_TITLE_MODE
    });
    function skipIfHasPrecedingDot(match, response) {
      const before = match.input[match.index - 1];
      if (before === ".") {
        response.ignoreMatch();
      }
    }
    function scopeClassName(mode, _parent) {
      if (mode.className !== void 0) {
        mode.scope = mode.className;
        delete mode.className;
      }
    }
    function beginKeywords(mode, parent) {
      if (!parent) return;
      if (!mode.beginKeywords) return;
      mode.begin = "\\b(" + mode.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)";
      mode.__beforeBegin = skipIfHasPrecedingDot;
      mode.keywords = mode.keywords || mode.beginKeywords;
      delete mode.beginKeywords;
      if (mode.relevance === void 0) mode.relevance = 0;
    }
    function compileIllegal(mode, _parent) {
      if (!Array.isArray(mode.illegal)) return;
      mode.illegal = either(...mode.illegal);
    }
    function compileMatch(mode, _parent) {
      if (!mode.match) return;
      if (mode.begin || mode.end) throw new Error("begin & end are not supported with match");
      mode.begin = mode.match;
      delete mode.match;
    }
    function compileRelevance(mode, _parent) {
      if (mode.relevance === void 0) mode.relevance = 1;
    }
    var beforeMatchExt = (mode, parent) => {
      if (!mode.beforeMatch) return;
      if (mode.starts) throw new Error("beforeMatch cannot be used with starts");
      const originalMode = Object.assign({}, mode);
      Object.keys(mode).forEach((key) => {
        delete mode[key];
      });
      mode.keywords = originalMode.keywords;
      mode.begin = concat(originalMode.beforeMatch, lookahead(originalMode.begin));
      mode.starts = {
        relevance: 0,
        contains: [
          Object.assign(originalMode, { endsParent: true })
        ]
      };
      mode.relevance = 0;
      delete originalMode.beforeMatch;
    };
    var COMMON_KEYWORDS = [
      "of",
      "and",
      "for",
      "in",
      "not",
      "or",
      "if",
      "then",
      "parent",
      // common variable name
      "list",
      // common variable name
      "value"
      // common variable name
    ];
    var DEFAULT_KEYWORD_SCOPE = "keyword";
    function compileKeywords(rawKeywords, caseInsensitive, scopeName = DEFAULT_KEYWORD_SCOPE) {
      const compiledKeywords = /* @__PURE__ */ Object.create(null);
      if (typeof rawKeywords === "string") {
        compileList(scopeName, rawKeywords.split(" "));
      } else if (Array.isArray(rawKeywords)) {
        compileList(scopeName, rawKeywords);
      } else {
        Object.keys(rawKeywords).forEach(function(scopeName2) {
          Object.assign(
            compiledKeywords,
            compileKeywords(rawKeywords[scopeName2], caseInsensitive, scopeName2)
          );
        });
      }
      return compiledKeywords;
      function compileList(scopeName2, keywordList) {
        if (caseInsensitive) {
          keywordList = keywordList.map((x2) => x2.toLowerCase());
        }
        keywordList.forEach(function(keyword) {
          const pair = keyword.split("|");
          compiledKeywords[pair[0]] = [scopeName2, scoreForKeyword(pair[0], pair[1])];
        });
      }
    }
    function scoreForKeyword(keyword, providedScore) {
      if (providedScore) {
        return Number(providedScore);
      }
      return commonKeyword(keyword) ? 0 : 1;
    }
    function commonKeyword(keyword) {
      return COMMON_KEYWORDS.includes(keyword.toLowerCase());
    }
    var seenDeprecations = {};
    var error = (message) => {
      console.error(message);
    };
    var warn = (message, ...args) => {
      console.log(`WARN: ${message}`, ...args);
    };
    var deprecated = (version2, message) => {
      if (seenDeprecations[`${version2}/${message}`]) return;
      console.log(`Deprecated as of ${version2}. ${message}`);
      seenDeprecations[`${version2}/${message}`] = true;
    };
    var MultiClassError = new Error();
    function remapScopeNames(mode, regexes, { key }) {
      let offset = 0;
      const scopeNames = mode[key];
      const emit4 = {};
      const positions = {};
      for (let i = 1; i <= regexes.length; i++) {
        positions[i + offset] = scopeNames[i];
        emit4[i + offset] = true;
        offset += countMatchGroups(regexes[i - 1]);
      }
      mode[key] = positions;
      mode[key]._emit = emit4;
      mode[key]._multi = true;
    }
    function beginMultiClass(mode) {
      if (!Array.isArray(mode.begin)) return;
      if (mode.skip || mode.excludeBegin || mode.returnBegin) {
        error("skip, excludeBegin, returnBegin not compatible with beginScope: {}");
        throw MultiClassError;
      }
      if (typeof mode.beginScope !== "object" || mode.beginScope === null) {
        error("beginScope must be object");
        throw MultiClassError;
      }
      remapScopeNames(mode, mode.begin, { key: "beginScope" });
      mode.begin = _rewriteBackreferences(mode.begin, { joinWith: "" });
    }
    function endMultiClass(mode) {
      if (!Array.isArray(mode.end)) return;
      if (mode.skip || mode.excludeEnd || mode.returnEnd) {
        error("skip, excludeEnd, returnEnd not compatible with endScope: {}");
        throw MultiClassError;
      }
      if (typeof mode.endScope !== "object" || mode.endScope === null) {
        error("endScope must be object");
        throw MultiClassError;
      }
      remapScopeNames(mode, mode.end, { key: "endScope" });
      mode.end = _rewriteBackreferences(mode.end, { joinWith: "" });
    }
    function scopeSugar(mode) {
      if (mode.scope && typeof mode.scope === "object" && mode.scope !== null) {
        mode.beginScope = mode.scope;
        delete mode.scope;
      }
    }
    function MultiClass(mode) {
      scopeSugar(mode);
      if (typeof mode.beginScope === "string") {
        mode.beginScope = { _wrap: mode.beginScope };
      }
      if (typeof mode.endScope === "string") {
        mode.endScope = { _wrap: mode.endScope };
      }
      beginMultiClass(mode);
      endMultiClass(mode);
    }
    function compileLanguage(language) {
      function langRe(value, global) {
        return new RegExp(
          source(value),
          "m" + (language.case_insensitive ? "i" : "") + (language.unicodeRegex ? "u" : "") + (global ? "g" : "")
        );
      }
      class MultiRegex {
        constructor() {
          this.matchIndexes = {};
          this.regexes = [];
          this.matchAt = 1;
          this.position = 0;
        }
        // @ts-ignore
        addRule(re, opts) {
          opts.position = this.position++;
          this.matchIndexes[this.matchAt] = opts;
          this.regexes.push([opts, re]);
          this.matchAt += countMatchGroups(re) + 1;
        }
        compile() {
          if (this.regexes.length === 0) {
            this.exec = () => null;
          }
          const terminators = this.regexes.map((el) => el[1]);
          this.matcherRe = langRe(_rewriteBackreferences(terminators, { joinWith: "|" }), true);
          this.lastIndex = 0;
        }
        /** @param {string} s */
        exec(s) {
          this.matcherRe.lastIndex = this.lastIndex;
          const match = this.matcherRe.exec(s);
          if (!match) {
            return null;
          }
          const i = match.findIndex((el, i2) => i2 > 0 && el !== void 0);
          const matchData = this.matchIndexes[i];
          match.splice(0, i);
          return Object.assign(match, matchData);
        }
      }
      class ResumableMultiRegex {
        constructor() {
          this.rules = [];
          this.multiRegexes = [];
          this.count = 0;
          this.lastIndex = 0;
          this.regexIndex = 0;
        }
        // @ts-ignore
        getMatcher(index) {
          if (this.multiRegexes[index]) return this.multiRegexes[index];
          const matcher = new MultiRegex();
          this.rules.slice(index).forEach(([re, opts]) => matcher.addRule(re, opts));
          matcher.compile();
          this.multiRegexes[index] = matcher;
          return matcher;
        }
        resumingScanAtSamePosition() {
          return this.regexIndex !== 0;
        }
        considerAll() {
          this.regexIndex = 0;
        }
        // @ts-ignore
        addRule(re, opts) {
          this.rules.push([re, opts]);
          if (opts.type === "begin") this.count++;
        }
        /** @param {string} s */
        exec(s) {
          const m2 = this.getMatcher(this.regexIndex);
          m2.lastIndex = this.lastIndex;
          let result = m2.exec(s);
          if (this.resumingScanAtSamePosition()) {
            if (result && result.index === this.lastIndex) ;
            else {
              const m22 = this.getMatcher(0);
              m22.lastIndex = this.lastIndex + 1;
              result = m22.exec(s);
            }
          }
          if (result) {
            this.regexIndex += result.position + 1;
            if (this.regexIndex === this.count) {
              this.considerAll();
            }
          }
          return result;
        }
      }
      function buildModeRegex(mode) {
        const mm = new ResumableMultiRegex();
        mode.contains.forEach((term) => mm.addRule(term.begin, { rule: term, type: "begin" }));
        if (mode.terminatorEnd) {
          mm.addRule(mode.terminatorEnd, { type: "end" });
        }
        if (mode.illegal) {
          mm.addRule(mode.illegal, { type: "illegal" });
        }
        return mm;
      }
      function compileMode(mode, parent) {
        const cmode = (
          /** @type CompiledMode */
          mode
        );
        if (mode.isCompiled) return cmode;
        [
          scopeClassName,
          // do this early so compiler extensions generally don't have to worry about
          // the distinction between match/begin
          compileMatch,
          MultiClass,
          beforeMatchExt
        ].forEach((ext) => ext(mode, parent));
        language.compilerExtensions.forEach((ext) => ext(mode, parent));
        mode.__beforeBegin = null;
        [
          beginKeywords,
          // do this later so compiler extensions that come earlier have access to the
          // raw array if they wanted to perhaps manipulate it, etc.
          compileIllegal,
          // default to 1 relevance if not specified
          compileRelevance
        ].forEach((ext) => ext(mode, parent));
        mode.isCompiled = true;
        let keywordPattern = null;
        if (typeof mode.keywords === "object" && mode.keywords.$pattern) {
          mode.keywords = Object.assign({}, mode.keywords);
          keywordPattern = mode.keywords.$pattern;
          delete mode.keywords.$pattern;
        }
        keywordPattern = keywordPattern || /\w+/;
        if (mode.keywords) {
          mode.keywords = compileKeywords(mode.keywords, language.case_insensitive);
        }
        cmode.keywordPatternRe = langRe(keywordPattern, true);
        if (parent) {
          if (!mode.begin) mode.begin = /\B|\b/;
          cmode.beginRe = langRe(cmode.begin);
          if (!mode.end && !mode.endsWithParent) mode.end = /\B|\b/;
          if (mode.end) cmode.endRe = langRe(cmode.end);
          cmode.terminatorEnd = source(cmode.end) || "";
          if (mode.endsWithParent && parent.terminatorEnd) {
            cmode.terminatorEnd += (mode.end ? "|" : "") + parent.terminatorEnd;
          }
        }
        if (mode.illegal) cmode.illegalRe = langRe(
          /** @type {RegExp | string} */
          mode.illegal
        );
        if (!mode.contains) mode.contains = [];
        mode.contains = [].concat(...mode.contains.map(function(c) {
          return expandOrCloneMode(c === "self" ? mode : c);
        }));
        mode.contains.forEach(function(c) {
          compileMode(
            /** @type Mode */
            c,
            cmode
          );
        });
        if (mode.starts) {
          compileMode(mode.starts, parent);
        }
        cmode.matcher = buildModeRegex(cmode);
        return cmode;
      }
      if (!language.compilerExtensions) language.compilerExtensions = [];
      if (language.contains && language.contains.includes("self")) {
        throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
      }
      language.classNameAliases = inherit$1(language.classNameAliases || {});
      return compileMode(
        /** @type Mode */
        language
      );
    }
    function dependencyOnParent(mode) {
      if (!mode) return false;
      return mode.endsWithParent || dependencyOnParent(mode.starts);
    }
    function expandOrCloneMode(mode) {
      if (mode.variants && !mode.cachedVariants) {
        mode.cachedVariants = mode.variants.map(function(variant) {
          return inherit$1(mode, { variants: null }, variant);
        });
      }
      if (mode.cachedVariants) {
        return mode.cachedVariants;
      }
      if (dependencyOnParent(mode)) {
        return inherit$1(mode, { starts: mode.starts ? inherit$1(mode.starts) : null });
      }
      if (Object.isFrozen(mode)) {
        return inherit$1(mode);
      }
      return mode;
    }
    var version = "11.12.0";
    var HTMLInjectionError = class extends Error {
      constructor(reason, html) {
        super(reason);
        this.name = "HTMLInjectionError";
        this.html = html;
      }
    };
    var escape = escapeHTML;
    var inherit = inherit$1;
    var NO_MATCH = Symbol("nomatch");
    var MAX_KEYWORD_HITS = 7;
    var HLJS = function(hljs) {
      const languages = /* @__PURE__ */ Object.create(null);
      const aliases = /* @__PURE__ */ Object.create(null);
      const plugins = [];
      let SAFE_MODE = true;
      const LANGUAGE_NOT_FOUND = "Could not find the language '{}', did you forget to load/include a language module?";
      const PLAINTEXT_LANGUAGE = { disableAutodetect: true, name: "Plain text", contains: [] };
      let options = {
        ignoreUnescapedHTML: false,
        throwUnescapedHTML: false,
        noHighlightRe: /^(no-?highlight)$/i,
        languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
        classPrefix: "hljs-",
        cssSelector: "pre code",
        languages: null,
        // beta configuration options, subject to change, welcome to discuss
        // https://github.com/highlightjs/highlight.js/issues/1086
        __emitter: TokenTreeEmitter
      };
      function shouldNotHighlight(languageName) {
        return options.noHighlightRe.test(languageName);
      }
      function blockLanguage(block) {
        let classes = block.className + " ";
        classes += block.parentNode ? block.parentNode.className : "";
        const match = options.languageDetectRe.exec(classes);
        if (match) {
          const language = getLanguage(match[1]);
          if (!language) {
            warn(LANGUAGE_NOT_FOUND.replace("{}", match[1]));
            warn("Falling back to no-highlight mode for this block.", block);
          }
          return language ? match[1] : "no-highlight";
        }
        return classes.split(/\s+/).find((_class) => shouldNotHighlight(_class) || getLanguage(_class));
      }
      function highlight2(codeOrLanguageName, optionsOrCode, ignoreIllegals) {
        let code = "";
        let languageName = "";
        if (typeof optionsOrCode === "object") {
          code = codeOrLanguageName;
          ignoreIllegals = optionsOrCode.ignoreIllegals;
          languageName = optionsOrCode.language;
        } else {
          deprecated("10.7.0", "highlight(lang, code, ...args) has been deprecated.");
          deprecated("10.7.0", "Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277");
          languageName = codeOrLanguageName;
          code = optionsOrCode;
        }
        if (ignoreIllegals === void 0) {
          ignoreIllegals = true;
        }
        const context = {
          code,
          language: languageName
        };
        fire("before:highlight", context);
        const result = context.result ? context.result : _highlight(context.language, context.code, ignoreIllegals);
        result.code = context.code;
        fire("after:highlight", result);
        return result;
      }
      function _highlight(languageName, codeToHighlight, ignoreIllegals, continuation) {
        const keywordHits = /* @__PURE__ */ Object.create(null);
        function keywordData(mode, matchText) {
          return mode.keywords[matchText];
        }
        function processKeywords() {
          if (!top.keywords) {
            emitter.addText(modeBuffer);
            return;
          }
          let lastIndex = 0;
          top.keywordPatternRe.lastIndex = 0;
          let match = top.keywordPatternRe.exec(modeBuffer);
          let buf = "";
          while (match) {
            buf += modeBuffer.substring(lastIndex, match.index);
            const word = language.case_insensitive ? match[0].toLowerCase() : match[0];
            const data = keywordData(top, word);
            if (data) {
              const [kind, keywordRelevance] = data;
              emitter.addText(buf);
              buf = "";
              keywordHits[word] = (keywordHits[word] || 0) + 1;
              if (keywordHits[word] <= MAX_KEYWORD_HITS) relevance += keywordRelevance;
              if (kind.startsWith("_")) {
                buf += match[0];
              } else {
                const cssClass = language.classNameAliases[kind] || kind;
                emitKeyword(match[0], cssClass);
              }
            } else {
              buf += match[0];
            }
            lastIndex = top.keywordPatternRe.lastIndex;
            match = top.keywordPatternRe.exec(modeBuffer);
          }
          buf += modeBuffer.substring(lastIndex);
          emitter.addText(buf);
        }
        function processSubLanguage() {
          if (modeBuffer === "") return;
          let result2 = null;
          if (typeof top.subLanguage === "string") {
            if (!languages[top.subLanguage]) {
              emitter.addText(modeBuffer);
              return;
            }
            result2 = _highlight(top.subLanguage, modeBuffer, true, continuations[top.subLanguage]);
            continuations[top.subLanguage] = /** @type {CompiledMode} */
            result2._top;
          } else {
            result2 = highlightAuto(modeBuffer, top.subLanguage.length ? top.subLanguage : null);
          }
          if (top.relevance > 0) {
            relevance += result2.relevance;
          }
          emitter.__addSublanguage(result2._emitter, result2.language);
        }
        function processBuffer() {
          if (top.subLanguage != null) {
            processSubLanguage();
          } else {
            processKeywords();
          }
          modeBuffer = "";
        }
        function emitKeyword(keyword, scope) {
          if (keyword === "") return;
          emitter.startScope(scope);
          emitter.addText(keyword);
          emitter.endScope();
        }
        function emitMultiClass(scope, match) {
          let i = 1;
          const max = match.length - 1;
          while (i <= max) {
            if (!scope._emit[i]) {
              i++;
              continue;
            }
            const klass = language.classNameAliases[scope[i]] || scope[i];
            const text = match[i];
            if (klass) {
              emitKeyword(text, klass);
            } else {
              modeBuffer = text;
              processKeywords();
              modeBuffer = "";
            }
            i++;
          }
        }
        function startNewMode(mode, match) {
          if (mode.scope && typeof mode.scope === "string") {
            emitter.openNode(language.classNameAliases[mode.scope] || mode.scope);
          }
          if (mode.beginScope) {
            if (mode.beginScope._wrap) {
              emitKeyword(modeBuffer, language.classNameAliases[mode.beginScope._wrap] || mode.beginScope._wrap);
              modeBuffer = "";
            } else if (mode.beginScope._multi) {
              emitMultiClass(mode.beginScope, match);
              modeBuffer = "";
            }
          }
          top = Object.create(mode, { parent: { value: top } });
          return top;
        }
        function endOfMode(mode, match, matchPlusRemainder) {
          let matched = startsWith(mode.endRe, matchPlusRemainder);
          if (matched) {
            if (mode["on:end"]) {
              const resp = new Response(mode);
              mode["on:end"](match, resp);
              if (resp.isMatchIgnored) matched = false;
            }
            if (matched) {
              while (mode.endsParent && mode.parent) {
                mode = mode.parent;
              }
              return mode;
            }
          }
          if (mode.endsWithParent) {
            return endOfMode(mode.parent, match, matchPlusRemainder);
          }
        }
        function doIgnore(lexeme) {
          if (top.matcher.regexIndex === 0) {
            modeBuffer += lexeme[0];
            return 1;
          } else {
            resumeScanAtSamePosition = true;
            return 0;
          }
        }
        function doBeginMatch(match) {
          const lexeme = match[0];
          const newMode = match.rule;
          const resp = new Response(newMode);
          const beforeCallbacks = [newMode.__beforeBegin, newMode["on:begin"]];
          for (const cb of beforeCallbacks) {
            if (!cb) continue;
            cb(match, resp);
            if (resp.isMatchIgnored) return doIgnore(lexeme);
          }
          if (newMode.skip) {
            modeBuffer += lexeme;
          } else {
            if (newMode.excludeBegin) {
              modeBuffer += lexeme;
            }
            processBuffer();
            if (!newMode.returnBegin && !newMode.excludeBegin) {
              modeBuffer = lexeme;
            }
          }
          startNewMode(newMode, match);
          return newMode.returnBegin ? 0 : lexeme.length;
        }
        function doEndMatch(match) {
          const lexeme = match[0];
          const matchPlusRemainder = codeToHighlight.substring(match.index);
          const endMode = endOfMode(top, match, matchPlusRemainder);
          if (!endMode) {
            return NO_MATCH;
          }
          const origin = top;
          if (top.endScope && top.endScope._wrap) {
            processBuffer();
            emitKeyword(lexeme, top.endScope._wrap);
          } else if (top.endScope && top.endScope._multi) {
            processBuffer();
            emitMultiClass(top.endScope, match);
          } else if (origin.skip) {
            modeBuffer += lexeme;
          } else {
            if (!(origin.returnEnd || origin.excludeEnd)) {
              modeBuffer += lexeme;
            }
            processBuffer();
            if (origin.excludeEnd) {
              modeBuffer = lexeme;
            }
          }
          do {
            if (top.scope) {
              emitter.closeNode();
            }
            if (!top.skip && !top.subLanguage) {
              relevance += top.relevance;
            }
            top = top.parent;
          } while (top !== endMode.parent);
          if (endMode.starts) {
            startNewMode(endMode.starts, match);
          }
          return origin.returnEnd ? 0 : lexeme.length;
        }
        function processContinuations() {
          const list = [];
          for (let current3 = top; current3 !== language; current3 = current3.parent) {
            if (current3.scope) {
              list.unshift(current3.scope);
            }
          }
          list.forEach((item) => emitter.openNode(item));
        }
        let lastMatch = {};
        function processLexeme(textBeforeMatch, match) {
          const lexeme = match && match[0];
          modeBuffer += textBeforeMatch;
          if (lexeme == null) {
            processBuffer();
            return 0;
          }
          if (lastMatch.type === "begin" && match.type === "end" && lastMatch.index === match.index && lexeme === "") {
            modeBuffer += codeToHighlight.slice(match.index, match.index + 1);
            if (!SAFE_MODE) {
              const err = new Error(`0 width match regex (${languageName})`);
              err.languageName = languageName;
              err.badRule = lastMatch.rule;
              throw err;
            }
            return 1;
          }
          lastMatch = match;
          if (match.type === "begin") {
            return doBeginMatch(match);
          } else if (match.type === "illegal" && !ignoreIllegals) {
            const err = new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.scope || "<unnamed>") + '"');
            err.mode = top;
            throw err;
          } else if (match.type === "end") {
            const processed = doEndMatch(match);
            if (processed !== NO_MATCH) {
              return processed;
            }
          }
          if (match.type === "illegal" && lexeme === "") {
            if (match.index === codeToHighlight.length) ;
            else {
              modeBuffer += "\n";
            }
            return 1;
          }
          if (iterations > 1e5 && iterations > match.index * 3) {
            const err = new Error("potential infinite loop, way more iterations than matches");
            throw err;
          }
          modeBuffer += lexeme;
          return lexeme.length;
        }
        const language = getLanguage(languageName);
        if (!language) {
          error(LANGUAGE_NOT_FOUND.replace("{}", languageName));
          throw new Error('Unknown language: "' + languageName + '"');
        }
        const md = compileLanguage(language);
        let result = "";
        let top = continuation || md;
        const continuations = {};
        const emitter = new options.__emitter(options);
        processContinuations();
        let modeBuffer = "";
        let relevance = 0;
        let index = 0;
        let iterations = 0;
        let resumeScanAtSamePosition = false;
        try {
          if (!language.__emitTokens) {
            top.matcher.considerAll();
            for (; ; ) {
              iterations++;
              if (resumeScanAtSamePosition) {
                resumeScanAtSamePosition = false;
              } else {
                top.matcher.considerAll();
              }
              top.matcher.lastIndex = index;
              const match = top.matcher.exec(codeToHighlight);
              if (!match) break;
              const beforeMatch = codeToHighlight.substring(index, match.index);
              const processedCount = processLexeme(beforeMatch, match);
              index = match.index + processedCount;
            }
            processLexeme(codeToHighlight.substring(index));
          } else {
            language.__emitTokens(codeToHighlight, emitter);
          }
          emitter.finalize();
          result = emitter.toHTML();
          return {
            language: languageName,
            value: result,
            relevance,
            illegal: false,
            _emitter: emitter,
            _top: top
          };
        } catch (err) {
          if (err.message && err.message.includes("Illegal")) {
            return {
              language: languageName,
              value: escape(codeToHighlight),
              illegal: true,
              relevance: 0,
              _illegalBy: {
                message: err.message,
                index,
                context: codeToHighlight.slice(index - 100, index + 100),
                mode: err.mode,
                resultSoFar: result
              },
              _emitter: emitter
            };
          } else if (SAFE_MODE) {
            return {
              language: languageName,
              value: escape(codeToHighlight),
              illegal: false,
              relevance: 0,
              errorRaised: err,
              _emitter: emitter,
              _top: top
            };
          } else {
            throw err;
          }
        }
      }
      function justTextHighlightResult(code) {
        const result = {
          value: escape(code),
          illegal: false,
          relevance: 0,
          _top: PLAINTEXT_LANGUAGE,
          _emitter: new options.__emitter(options)
        };
        result._emitter.addText(code);
        return result;
      }
      function highlightAuto(code, languageSubset) {
        languageSubset = languageSubset || options.languages || Object.keys(languages);
        const plaintext2 = justTextHighlightResult(code);
        const results = languageSubset.filter(getLanguage).filter(autoDetection).map(
          (name) => _highlight(name, code, false)
        );
        results.unshift(plaintext2);
        const sorted = results.sort((a, b2) => {
          if (a.relevance !== b2.relevance) return b2.relevance - a.relevance;
          if (a.language && b2.language) {
            if (getLanguage(a.language).supersetOf === b2.language) {
              return 1;
            } else if (getLanguage(b2.language).supersetOf === a.language) {
              return -1;
            }
          }
          return 0;
        });
        const [best, secondBest] = sorted;
        const result = best;
        result.secondBest = secondBest;
        return result;
      }
      function updateClassName(element, currentLang, resultLang) {
        const language = currentLang && aliases[currentLang] || resultLang;
        element.classList.add("hljs");
        element.classList.add(`language-${language}`);
      }
      function highlightElement(element) {
        let node = null;
        const language = blockLanguage(element);
        if (shouldNotHighlight(language)) return;
        fire(
          "before:highlightElement",
          { el: element, language }
        );
        if (element.dataset.highlighted) {
          console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", element);
          return;
        }
        if (element.children.length > 0) {
          if (!options.ignoreUnescapedHTML) {
            console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk.");
            console.warn("https://github.com/highlightjs/highlight.js/wiki/security");
            console.warn("The element with unescaped HTML:");
            console.warn(element);
          }
          if (options.throwUnescapedHTML) {
            const err = new HTMLInjectionError(
              "One of your code blocks includes unescaped HTML.",
              element.innerHTML
            );
            throw err;
          }
        }
        node = element;
        const text = node.textContent;
        const result = language ? highlight2(text, { language, ignoreIllegals: true }) : highlightAuto(text);
        element.innerHTML = result.value;
        element.dataset.highlighted = "yes";
        updateClassName(element, language, result.language);
        element.result = {
          language: result.language,
          // TODO: remove with version 11.0
          re: result.relevance,
          relevance: result.relevance
        };
        if (result.secondBest) {
          element.secondBest = {
            language: result.secondBest.language,
            relevance: result.secondBest.relevance
          };
        }
        fire("after:highlightElement", { el: element, result, text });
      }
      function configure(userOptions) {
        options = inherit(options, userOptions);
      }
      const initHighlighting = () => {
        highlightAll();
        deprecated("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
      };
      function initHighlightingOnLoad() {
        highlightAll();
        deprecated("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
      }
      let wantsHighlight = false;
      function highlightAll() {
        function boot() {
          highlightAll();
        }
        if (document.readyState === "loading") {
          if (!wantsHighlight) {
            window.addEventListener("DOMContentLoaded", boot, false);
          }
          wantsHighlight = true;
          return;
        }
        const blocks = document.querySelectorAll(options.cssSelector);
        blocks.forEach(highlightElement);
      }
      function registerLanguage(languageName, languageDefinition) {
        let lang = null;
        try {
          lang = languageDefinition(hljs);
        } catch (error$1) {
          error("Language definition for '{}' could not be registered.".replace("{}", languageName));
          if (!SAFE_MODE) {
            throw error$1;
          } else {
            error(error$1);
          }
          lang = PLAINTEXT_LANGUAGE;
        }
        if (!lang.name) lang.name = languageName;
        languages[languageName] = lang;
        lang.rawDefinition = languageDefinition.bind(null, hljs);
        if (lang.aliases) {
          registerAliases(lang.aliases, { languageName });
        }
      }
      function unregisterLanguage(languageName) {
        delete languages[languageName];
        for (const alias of Object.keys(aliases)) {
          if (aliases[alias] === languageName) {
            delete aliases[alias];
          }
        }
      }
      function listLanguages() {
        return Object.keys(languages);
      }
      function getLanguage(name) {
        name = (name || "").toLowerCase();
        return languages[name] || languages[aliases[name]];
      }
      function registerAliases(aliasList, { languageName }) {
        if (typeof aliasList === "string") {
          aliasList = [aliasList];
        }
        aliasList.forEach((alias) => {
          aliases[alias.toLowerCase()] = languageName;
        });
      }
      function autoDetection(name) {
        const lang = getLanguage(name);
        return lang && !lang.disableAutodetect;
      }
      function upgradePluginAPI(plugin) {
        if (plugin["before:highlightBlock"] && !plugin["before:highlightElement"]) {
          plugin["before:highlightElement"] = (data) => {
            plugin["before:highlightBlock"](
              Object.assign({ block: data.el }, data)
            );
          };
        }
        if (plugin["after:highlightBlock"] && !plugin["after:highlightElement"]) {
          plugin["after:highlightElement"] = (data) => {
            plugin["after:highlightBlock"](
              Object.assign({ block: data.el }, data)
            );
          };
        }
      }
      function addPlugin(plugin) {
        upgradePluginAPI(plugin);
        plugins.push(plugin);
      }
      function removePlugin(plugin) {
        const index = plugins.indexOf(plugin);
        if (index !== -1) {
          plugins.splice(index, 1);
        }
      }
      function fire(event, args) {
        const cb = event;
        plugins.forEach(function(plugin) {
          if (plugin[cb]) {
            plugin[cb](args);
          }
        });
      }
      function deprecateHighlightBlock(el) {
        deprecated("10.7.0", "highlightBlock will be removed entirely in v12.0");
        deprecated("10.7.0", "Please use highlightElement now.");
        return highlightElement(el);
      }
      Object.assign(hljs, {
        highlight: highlight2,
        highlightAuto,
        highlightAll,
        highlightElement,
        // TODO: Remove with v12 API
        highlightBlock: deprecateHighlightBlock,
        configure,
        initHighlighting,
        initHighlightingOnLoad,
        registerLanguage,
        unregisterLanguage,
        listLanguages,
        getLanguage,
        registerAliases,
        autoDetection,
        inherit,
        addPlugin,
        removePlugin
      });
      hljs.debugMode = function() {
        SAFE_MODE = false;
      };
      hljs.safeMode = function() {
        SAFE_MODE = true;
      };
      hljs.versionString = version;
      hljs.regex = {
        concat,
        lookahead,
        either,
        optional,
        anyNumberOfTimes
      };
      for (const key in MODES) {
        if (typeof MODES[key] === "object") {
          deepFreeze(MODES[key]);
        }
      }
      Object.assign(hljs, MODES);
      return hljs;
    };
    var highlight = HLJS({});
    highlight.newInstance = () => HLJS({});
    module2.exports = highlight;
    highlight.HighlightJS = highlight;
    highlight.default = highlight;
  }
});

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/remote.ts
var passthrough = { parse: (value) => value };
var jsonParam = (name) => ({
  name,
  wire: name,
  source: "json",
  codec: { mode: "strict", typeSymbol: "json", schema: passthrough }
});
var jsonResult = { mode: "strict", typeSymbol: "json", schema: passthrough };
var direct = (method, parameters) => ({
  id: `dsh-file#fileManager/${method}`,
  service: "fileManager",
  namespace: "fileManager",
  method,
  invocation: { kind: "direct" },
  parameters: parameters.map(jsonParam),
  result: jsonResult
});
var TYPERT_REMOTE = {
  package: "dsh-file",
  descriptors: [
    direct("listDir", ["path"]),
    direct("readText", ["path"]),
    direct("readDataUrl", ["path"]),
    direct("writeText", ["path", "content"]),
    direct("createFile", ["path"]),
    direct("createDirectory", ["path"]),
    direct("rename", ["from", "to"]),
    direct("delete", ["path"]),
    direct("stat", ["path"]),
    direct("resolve", ["path"]),
    direct("getRoot", []),
    direct("setRoot", ["path"])
  ]
};
function unwrap(result) {
  if (result.ok) return result.value;
  const { code, message } = result.error;
  const err = new Error(`${message}${code ? ` (${code})` : ""}`);
  err.code = code;
  throw err;
}

// src/client/FileManagerPanel.tsx
var import_react3 = require("react");

// src/client/FileTree.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}
var FileTree = (0, import_react.forwardRef)(function FileTree2({ remote, root, onOpenFile, onDelete, onRenamed, onNotice }, ref) {
  const [expanded, setExpanded] = (0, import_react.useState)({ [root]: { path: root, entries: null } });
  const [selected, setSelected] = (0, import_react.useState)(null);
  const [editing, setEditing] = (0, import_react.useState)(null);
  const [rev, setRev] = (0, import_react.useState)(0);
  const dirPaths = (0, import_react.useRef)(/* @__PURE__ */ new Set());
  const parentOf = (0, import_react.useCallback)(
    (p) => {
      const i = p.lastIndexOf("/");
      if (i <= 0) return root;
      return p.slice(0, i) || root;
    },
    [root]
  );
  const loadDir = (0, import_react.useCallback)(
    async (path) => {
      setExpanded((prev) => ({ ...prev, [path]: { ...prev[path] ?? { path }, entries: null, error: void 0 } }));
      try {
        const value = unwrap(await remote.listDir(path));
        setExpanded((prev) => ({ ...prev, [path]: { path, entries: value.entries } }));
      } catch (error) {
        setExpanded((prev) => ({ ...prev, [path]: { path, entries: [], error: error instanceof Error ? error.message : String(error) } }));
      }
    },
    [remote]
  );
  (0, import_react.useEffect)(() => {
    setEditing(null);
    void loadDir(root);
  }, [root, rev, loadDir]);
  const cwdTarget = (0, import_react.useCallback)(() => {
    if (selected === null) return root;
    if (dirPaths.current.has(selected)) return selected;
    return parentOf(selected);
  }, [selected, root, parentOf]);
  const beginCreate = (0, import_react.useCallback)(
    (kind) => {
      const parent = cwdTarget();
      if (parent !== root && expanded[parent] === void 0) void loadDir(parent);
      setSelected(parent);
      setEditing({ mode: "create", parent, kind });
    },
    [cwdTarget, expanded, loadDir, root]
  );
  (0, import_react.useImperativeHandle)(ref, () => ({
    refresh: () => setRev((v2) => v2 + 1),
    beginCreate
  }), [beginCreate]);
  const cancelEdit = (0, import_react.useCallback)(() => setEditing(null), []);
  const submitCreate = (0, import_react.useCallback)(
    async (name) => {
      if (editing?.mode !== "create") return true;
      const trimmed = name.trim();
      if (trimmed === "") return true;
      if (trimmed.includes("/")) {
        onNotice("\u540D\u79F0\u4E0D\u80FD\u5305\u542B /");
        return false;
      }
      const target = `${editing.parent.replace(/\/$/, "")}/${trimmed}`;
      try {
        if (editing.kind === "directory") await unwrap(await remote.createDirectory(target));
        else await unwrap(await remote.createFile(target));
      } catch (error) {
        onNotice(`\u521B\u5EFA\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
      await loadDir(editing.parent);
      setEditing(null);
      setSelected(target);
      onNotice(editing.kind === "directory" ? `\u5DF2\u521B\u5EFA\u76EE\u5F55 ${trimmed}` : `\u5DF2\u521B\u5EFA\u6587\u4EF6 ${trimmed}`);
      if (editing.kind === "file") onOpenFile(target);
      return true;
    },
    [editing, remote, loadDir, onNotice, onOpenFile]
  );
  const submitRename = (0, import_react.useCallback)(
    async (name) => {
      if (editing?.mode !== "rename") return true;
      const from = editing.path;
      const trimmed = name.trim();
      const oldName = from.split("/").pop() ?? "";
      if (trimmed === "" || trimmed === oldName) return true;
      if (trimmed.includes("/")) {
        onNotice("\u540D\u79F0\u4E0D\u80FD\u5305\u542B /");
        return false;
      }
      const to = `${parentOf(from).replace(/\/$/, "")}/${trimmed}`;
      try {
        await unwrap(await remote.rename(from, to));
      } catch (error) {
        onNotice(`\u91CD\u547D\u540D\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
      await loadDir(parentOf(from));
      setEditing(null);
      setSelected(to);
      onRenamed(from, to);
      onNotice(`\u5DF2\u91CD\u547D\u540D ${trimmed}`);
      return true;
    },
    [editing, remote, loadDir, parentOf, onRenamed, onNotice]
  );
  const node = expanded[root];
  const renderLevel = (0, import_react.useCallback)(
    (path, entries, depth) => {
      const draftHere = editing?.mode === "create" && editing.parent === path ? editing : null;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        draftHere !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          InlineInput,
          {
            depth,
            isDir: draftHere.kind === "directory",
            initial: "",
            onSubmit: submitCreate,
            onCancel: cancelEdit
          }
        ),
        entries.map((entry) => {
          const full = `${path.replace(/\/$/, "")}/${entry.name}`;
          const isDir = entry.type === "directory";
          if (isDir) dirPaths.current.add(full);
          const isOpen = expanded[full] !== void 0;
          const isRenaming = editing?.mode === "rename" && editing.path === full;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            isRenaming ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              InlineInput,
              {
                depth,
                isDir,
                initial: entry.name,
                onSubmit: submitRename,
                onCancel: cancelEdit
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                className: cx("dshf-node", selected === full && "dshf-selected"),
                style: { paddingLeft: `${8 + depth * 14}px` },
                onClick: () => {
                  setSelected(full);
                  if (isDir) {
                    if (isOpen) {
                      setExpanded((prev) => {
                        const next = { ...prev };
                        delete next[full];
                        return next;
                      });
                    } else {
                      void loadDir(full);
                    }
                  } else {
                    onOpenFile(full);
                  }
                },
                onDoubleClick: () => {
                  if (!isDir && selected === full) onOpenFile(full);
                },
                title: full,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshf-caret", children: isDir ? isOpen ? "\u25BE" : "\u25B8" : "" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cx("dshf-icon", isDir ? "dshf-icon-dir" : "dshf-icon-file"), children: isDir ? "\u{1F4C1}" : "\u{1F4C4}" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshf-name", children: entry.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dshf-node-actions", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dshf-mini", title: "\u91CD\u547D\u540D", onClick: (e) => {
                      e.stopPropagation();
                      setSelected(full);
                      setEditing({ mode: "rename", path: full });
                    }, children: "\u270E" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dshf-mini", title: "\u5220\u9664", onClick: (e) => {
                      e.stopPropagation();
                      onDelete(full);
                    }, children: "\u{1F5D1}" })
                  ] })
                ]
              }
            ),
            isDir && isOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              DirChildren,
              {
                node: expanded[full],
                depth: depth + 1,
                onRender: renderLevel
              }
            )
          ] }, full);
        })
      ] });
    },
    [expanded, selected, editing, loadDir, onOpenFile, onDelete, submitCreate, submitRename, cancelEdit]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshf-tree-scroll", children: node === void 0 ? null : node.entries === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshf-tree-hint", children: node.error ? `\u52A0\u8F7D\u5931\u8D25: ${node.error}` : "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshf-tree-list", children: [
    node.entries.length === 0 && editing?.mode !== "create" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshf-tree-hint", children: "\uFF08\u7A7A\u76EE\u5F55\uFF09" }),
    renderLevel(root, node.entries, 0)
  ] }) });
});
function DirChildren({ node, depth, onRender }) {
  if (node === void 0 || node.entries === null) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshf-tree-hint", style: { paddingLeft: `${8 + depth * 14}px` }, children: node?.error ?? "\u52A0\u8F7D\u4E2D\u2026" });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: onRender(node.path, node.entries, depth) });
}
function InlineInput({ depth, isDir, initial, onSubmit, onCancel }) {
  const [value, setValue] = (0, import_react.useState)(initial);
  const inputRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const el = inputRef.current;
    if (el === null) return;
    el.focus();
    const dot = initial.lastIndexOf(".");
    if (initial !== "" && dot > 0) el.setSelectionRange(0, dot);
    else el.select();
  }, [initial]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshf-node dshf-node-editing", style: { paddingLeft: `${8 + depth * 14}px` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshf-caret" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cx("dshf-icon", isDir ? "dshf-icon-dir" : "dshf-icon-file"), children: isDir ? "\u{1F4C1}" : "\u{1F4C4}" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        ref: inputRef,
        className: "dshf-inline-input",
        value,
        placeholder: initial === "" ? isDir ? "\u76EE\u5F55\u540D\u79F0" : "\u6587\u4EF6\u540D\u79F0" : void 0,
        onChange: (e) => setValue(e.target.value),
        onClick: (e) => e.stopPropagation(),
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void onSubmit(value);
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        },
        onBlur: onCancel
      }
    )
  ] });
}

// src/client/store.ts
var import_react2 = require("react");
var tabs = [];
var activePath = null;
var listeners = /* @__PURE__ */ new Set();
function emit() {
  for (const listener of listeners) listener();
}
function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function snapshot() {
  return tabs;
}
function snapshotActive() {
  return activePath;
}
function useTabs() {
  return (0, import_react2.useSyncExternalStore)(subscribe, snapshot);
}
function useActivePath() {
  return (0, import_react2.useSyncExternalStore)(subscribe, snapshotActive);
}
function openTab(tab) {
  const existing = tabs.find((t) => t.path === tab.path);
  if (existing) {
    activePath = tab.path;
  } else {
    tabs = [...tabs, tab];
    activePath = tab.path;
  }
  emit();
}
function focusTab(path) {
  if (tabs.some((t) => t.path === path)) {
    activePath = path;
    emit();
  }
}
function updateActiveContent(content) {
  if (activePath === null) return;
  tabs = tabs.map((t) => t.path === activePath ? { ...t, content, dirty: content !== t.savedContent } : t);
  emit();
}
function markSaved(path) {
  tabs = tabs.map((t) => t.path === path ? { ...t, savedContent: t.content, dirty: false } : t);
  emit();
}
function closeTab(path) {
  tabs = tabs.filter((t) => t.path !== path);
  if (activePath === path) {
    activePath = tabs.length > 0 ? tabs[tabs.length - 1].path : null;
  }
  emit();
}
function renameTab(from, to) {
  tabs = tabs.map((t) => t.path === from ? { ...t, path: to } : t);
  if (activePath === from) activePath = to;
  emit();
}
function removeTabs(paths) {
  const gone = new Set(paths);
  tabs = tabs.filter((t) => !gone.has(t.path));
  if (activePath !== null && gone.has(activePath)) {
    activePath = tabs.length > 0 ? tabs[tabs.length - 1].path : null;
  }
  emit();
}
function closeEditor() {
  activePath = null;
  emit();
}
function resetAll() {
  tabs = [];
  activePath = null;
  emit();
}
var editorViewActive = false;
var viewListeners = /* @__PURE__ */ new Set();
function emitView() {
  for (const listener of viewListeners) listener();
}
function setEditorViewActive(active) {
  if (editorViewActive === active) return;
  editorViewActive = active;
  emitView();
}
function isEditorViewActive() {
  return editorViewActive;
}
function subscribeEditorViewActive(listener) {
  viewListeners.add(listener);
  return () => {
    viewListeners.delete(listener);
  };
}

// src/client/FileManagerPanel.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function cx2(...parts) {
  return parts.filter(Boolean).join(" ");
}
function IconPlus(props) {
  const size = props.size ?? 16;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", style: { display: "block" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8.64453 1.5V7.34961H14.5V8.65039H8.64453V14.5H7.34473V8.65039H1.5V7.34961H7.34473V1.5H8.64453Z", fill: "currentColor" }) });
}
function IconFolderAdd(props) {
  const size = props.size ?? 16;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", style: { display: "block" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { transform: "translate(9.52 2.52)", d: "M3.55246 0L3.55246 2.44252L6 2.44252L6 3.55748L3.55246 3.55748L3.55246 6L2.43834 6L2.43834 3.55748L0 3.55748L0 2.44252L2.43834 2.44252L2.43834 0L3.55246 0Z", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { transform: "translate(0.3496 2.35)", d: "M4.76367 0C5.36861 1.80598e-05 5.93113 0.310294 6.25488 0.821289L6.78027 1.64941C6.79685 1.67558 6.81791 1.69775 6.83887 1.71973C6.72186 2.15521 6.65702 2.61192 6.65137 3.08301C6.25601 2.96045 5.90909 2.70478 5.68164 2.3457L5.15723 1.5166C5.07183 1.38189 4.92318 1.3008 4.76367 1.30078L2.32422 1.30078C1.7589 1.30078 1.30078 1.7589 1.30078 2.32422L1.30078 10.1338C1.30078 10.6991 1.7589 11.1572 2.32422 11.1572L11.9766 11.1572C12.5419 11.1572 13 10.6991 13 8.58398C13.4545 8.5135 13.8903 8.38748 14.3008 8.21289L14.3008 10.1338C14.3008 11.4171 13.2598 12.458 11.9766 12.458L2.32422 12.458C1.04093 12.458 0 11.4171 0 10.1338L0 2.32422C0 1.04093 1.04093 0 2.32422 0L4.76367 0Z", fill: "currentColor" })
  ] });
}
function FileManagerPanel({ remote, onClose, useSessions, onFileOpened }) {
  const [root, setRoot] = (0, import_react3.useState)(null);
  const [rootError, setRootError] = (0, import_react3.useState)(null);
  const [busy, setBusy] = (0, import_react3.useState)(false);
  const [notice, setNotice] = (0, import_react3.useState)(null);
  const treeRef = (0, import_react3.useRef)(null);
  const sessionCwd = useSessions ? useSessions((s) => s.current !== void 0 ? s.byId[s.current]?.cwd : void 0) : void 0;
  (0, import_react3.useEffect)(() => {
    let cancelled = false;
    (async () => {
      try {
        if (sessionCwd !== void 0) {
          try {
            await unwrap(await remote.setRoot(sessionCwd));
          } catch {
          }
        }
        const { path } = unwrap(await remote.getRoot());
        if (!cancelled) {
          setRoot(path);
          setRootError(null);
        }
      } catch (error) {
        if (!cancelled) setRootError(error instanceof Error ? error.message : String(error));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [remote, sessionCwd]);
  (0, import_react3.useEffect)(() => () => {
    resetAll();
  }, []);
  const handleNotice = (0, import_react3.useCallback)((message) => {
    setNotice(message);
  }, []);
  const openFile = (0, import_react3.useCallback)(
    async (path) => {
      setBusy(true);
      try {
        const value = unwrap(await remote.readText(path));
        openTab({ path, content: value.content, savedContent: value.content, mtimeMs: value.mtimeMs, dirty: false });
        onFileOpened?.();
      } catch (error) {
        handleNotice(`\u6253\u5F00\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setBusy(false);
      }
    },
    [remote, handleNotice, onFileOpened]
  );
  const handleCreate = (0, import_react3.useCallback)((kind) => {
    treeRef.current?.beginCreate(kind);
  }, []);
  const handleRenamed = (0, import_react3.useCallback)((from, to) => {
    renameTab(from, to);
  }, []);
  const [pendingDelete, setPendingDelete] = (0, import_react3.useState)(null);
  const handleDelete = (0, import_react3.useCallback)((path) => {
    setPendingDelete(path);
  }, []);
  const confirmDelete = (0, import_react3.useCallback)(
    async () => {
      const path = pendingDelete;
      setPendingDelete(null);
      if (path === null) return;
      setBusy(true);
      try {
        await unwrap(await remote.delete(path));
        removeTabs([path]);
        treeRef.current?.refresh();
        handleNotice("\u5DF2\u5220\u9664");
      } catch (error) {
        handleNotice(`\u5220\u9664\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setBusy(false);
      }
    },
    [pendingDelete, remote, handleNotice]
  );
  const title = (0, import_react3.useMemo)(() => {
    if (root === null) return "\u2026";
    return root.split("/").filter(Boolean).pop() || "/";
  }, [root]);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshf-root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshf-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshf-title", title: root ?? "", children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshf-spacer" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshf-btn dshf-btn-icon", title: "\u65B0\u5EFA\u6587\u4EF6", "aria-label": "\u65B0\u5EFA\u6587\u4EF6", onClick: () => handleCreate("file"), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(IconPlus, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshf-btn dshf-btn-icon", title: "\u65B0\u5EFA\u76EE\u5F55", "aria-label": "\u65B0\u5EFA\u76EE\u5F55", onClick: () => handleCreate("directory"), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(IconFolderAdd, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshf-btn dshf-btn-icon", title: "\u5173\u95ED\u6587\u4EF6\u7BA1\u7406\u5668", "aria-label": "\u5173\u95ED\u6587\u4EF6\u7BA1\u7406\u5668", onClick: onClose, children: "\u2715" })
    ] }),
    rootError !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshf-error", children: rootError }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshf-tree-pane", children: root !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      FileTree,
      {
        ref: treeRef,
        remote,
        root,
        onOpenFile: (p) => void openFile(p),
        onDelete: (p) => void handleDelete(p),
        onRenamed: handleRenamed,
        onNotice: handleNotice
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshf-status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshf-status-busy", children: busy ? "\u2026" : "" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: cx2("dshf-status-notice", notice === null && "dshf-hidden"), children: notice ?? "" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshf-spacer" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshf-status-hint", children: "\u70B9\u6587\u4EF6\u540E\u5728\u4E0A\u65B9\u300C\u6587\u4EF6\u300D\u6807\u7B7E\u4E2D\u7F16\u8F91" })
    ] }),
    pendingDelete !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      DeleteConfirmDialog,
      {
        path: pendingDelete,
        onConfirm: () => void confirmDelete(),
        onCancel: () => setPendingDelete(null)
      }
    )
  ] });
}
function DeleteConfirmDialog({ path, onConfirm, onCancel }) {
  const name = path.split("/").pop() ?? path;
  const confirmRef = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    confirmRef.current?.focus();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "div",
    {
      className: "dshf-modal-overlay",
      onClick: onCancel,
      onKeyDown: (e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel();
        }
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshf-modal", role: "alertdialog", "aria-modal": "true", "aria-label": "\u5220\u9664\u786E\u8BA4", onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshf-modal-title", children: [
          "\u5220\u9664 ",
          name
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshf-modal-body", children: [
          "\u786E\u5B9A\u5220\u9664 ",
          name,
          " \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshf-modal-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshf-btn", onClick: onCancel, children: "\u53D6\u6D88" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { ref: confirmRef, type: "button", className: "dshf-btn dshf-btn-danger", onClick: onConfirm, children: "\u5220\u9664" })
        ] })
      ] })
    }
  );
}

// src/client/FileEditorView.tsx
var import_react6 = require("react");

// node_modules/highlight.js/es/core.js
var import_core = __toESM(require_core(), 1);
var core_default = import_core.default;

// node_modules/highlight.js/es/languages/bash.js
function bash(hljs) {
  const regex = hljs.regex;
  const VAR = {};
  const BRACED_VAR = {
    begin: /\$\{/,
    end: /\}/,
    contains: [
      "self",
      {
        begin: /:-/,
        contains: [VAR]
      }
      // default values
    ]
  };
  Object.assign(VAR, {
    className: "variable",
    variants: [
      { begin: regex.concat(
        /\$[\w\d#@][\w\d_]*/,
        // negative look-ahead tries to avoid matching patterns that are not
        // Perl at all like $ident$, @ident@, etc.
        `(?![\\w\\d])(?![$])`
      ) },
      BRACED_VAR
    ]
  });
  const SUBST = {
    className: "subst",
    begin: /\$\(/,
    end: /\)/,
    contains: [hljs.BACKSLASH_ESCAPE]
  };
  const COMMENT = hljs.inherit(
    hljs.COMMENT(),
    {
      match: [
        /(^|\s)/,
        /#.*$/
      ],
      scope: {
        2: "comment"
      }
    }
  );
  const HERE_DOC = {
    begin: /<<-?\s*(?=\w+)/,
    starts: { contains: [
      hljs.END_SAME_AS_BEGIN({
        begin: /(\w+)/,
        end: /(\w+)/,
        className: "string"
      })
    ] }
  };
  const QUOTE_STRING = {
    className: "string",
    begin: /"/,
    end: /"/,
    contains: [
      hljs.BACKSLASH_ESCAPE,
      VAR,
      SUBST
    ]
  };
  SUBST.contains.push(QUOTE_STRING);
  const ESCAPED_QUOTE = {
    match: /\\"/
  };
  const APOS_STRING = {
    className: "string",
    begin: /'/,
    end: /'/
  };
  const ESCAPED_APOS = {
    match: /\\'/
  };
  const ARITHMETIC = {
    begin: /\$?\(\(/,
    end: /\)\)/,
    contains: [
      {
        begin: /\d+#[0-9a-f]+/,
        className: "number"
      },
      hljs.NUMBER_MODE,
      VAR
    ]
  };
  const SH_LIKE_SHELLS = [
    "fish",
    "bash",
    "zsh",
    "sh",
    "csh",
    "ksh",
    "tcsh",
    "dash",
    "scsh"
  ];
  const KNOWN_SHEBANG = hljs.SHEBANG({
    binary: `(${SH_LIKE_SHELLS.join("|")})`,
    relevance: 10
  });
  const FUNCTION = {
    className: "function",
    begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
    returnBegin: true,
    contains: [hljs.inherit(hljs.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
    relevance: 0
  };
  const KEYWORDS = [
    "if",
    "then",
    "else",
    "elif",
    "fi",
    "time",
    "for",
    "while",
    "until",
    "in",
    "do",
    "done",
    "case",
    "esac",
    "coproc",
    "function",
    "select"
  ];
  const LITERALS = [
    "true",
    "false"
  ];
  const PATH_MODE = { match: /(\/[a-z._-]+)+/ };
  const SHELL_BUILT_INS = [
    "break",
    "cd",
    "continue",
    "eval",
    "exec",
    "exit",
    "export",
    "getopts",
    "hash",
    "pwd",
    "readonly",
    "return",
    "shift",
    "test",
    "times",
    "trap",
    "umask",
    "unset"
  ];
  const BASH_BUILT_INS = [
    "alias",
    "bind",
    "builtin",
    "caller",
    "command",
    "declare",
    "echo",
    "enable",
    "help",
    "let",
    "local",
    "logout",
    "mapfile",
    "printf",
    "read",
    "readarray",
    "source",
    "sudo",
    "type",
    "typeset",
    "ulimit",
    "unalias"
  ];
  const ZSH_BUILT_INS = [
    "autoload",
    "bg",
    "bindkey",
    "bye",
    "cap",
    "chdir",
    "clone",
    "comparguments",
    "compcall",
    "compctl",
    "compdescribe",
    "compfiles",
    "compgroups",
    "compquote",
    "comptags",
    "comptry",
    "compvalues",
    "dirs",
    "disable",
    "disown",
    "echotc",
    "echoti",
    "emulate",
    "fc",
    "fg",
    "float",
    "functions",
    "getcap",
    "getln",
    "history",
    "integer",
    "jobs",
    "kill",
    "limit",
    "log",
    "noglob",
    "popd",
    "print",
    "pushd",
    "pushln",
    "rehash",
    "sched",
    "setcap",
    "setopt",
    "stat",
    "suspend",
    "ttyctl",
    "unfunction",
    "unhash",
    "unlimit",
    "unsetopt",
    "vared",
    "wait",
    "whence",
    "where",
    "which",
    "zcompile",
    "zformat",
    "zftp",
    "zle",
    "zmodload",
    "zparseopts",
    "zprof",
    "zpty",
    "zregexparse",
    "zsocket",
    "zstyle",
    "ztcp"
  ];
  const GNU_CORE_UTILS = [
    "chcon",
    "chgrp",
    "chown",
    "chmod",
    "cp",
    "dd",
    "df",
    "dir",
    "dircolors",
    "ln",
    "ls",
    "mkdir",
    "mkfifo",
    "mknod",
    "mktemp",
    "mv",
    "realpath",
    "rm",
    "rmdir",
    "shred",
    "sync",
    "touch",
    "truncate",
    "vdir",
    "b2sum",
    "base32",
    "base64",
    "cat",
    "cksum",
    "comm",
    "csplit",
    "cut",
    "expand",
    "fmt",
    "fold",
    "head",
    "join",
    "md5sum",
    "nl",
    "numfmt",
    "od",
    "paste",
    "ptx",
    "pr",
    "sha1sum",
    "sha224sum",
    "sha256sum",
    "sha384sum",
    "sha512sum",
    "shuf",
    "sort",
    "split",
    "sum",
    "tac",
    "tail",
    "tr",
    "tsort",
    "unexpand",
    "uniq",
    "wc",
    "arch",
    "basename",
    "chroot",
    "date",
    "dirname",
    "du",
    "echo",
    "env",
    "expr",
    "factor",
    // "false", // keyword literal already
    "groups",
    "hostid",
    "id",
    "link",
    "logname",
    "nice",
    "nohup",
    "nproc",
    "pathchk",
    "pinky",
    "printenv",
    "printf",
    "pwd",
    "readlink",
    "runcon",
    "seq",
    "sleep",
    "stat",
    "stdbuf",
    "stty",
    "tee",
    "test",
    "timeout",
    // "true", // keyword literal already
    "tty",
    "uname",
    "unlink",
    "uptime",
    "users",
    "who",
    "whoami",
    "yes"
  ];
  return {
    name: "Bash",
    aliases: [
      "sh",
      "zsh"
    ],
    keywords: {
      $pattern: /\b[a-z][a-z0-9._-]+\b/,
      keyword: KEYWORDS,
      literal: LITERALS,
      built_in: [
        ...SHELL_BUILT_INS,
        ...BASH_BUILT_INS,
        // Shell modifiers
        "set",
        "shopt",
        ...ZSH_BUILT_INS,
        ...GNU_CORE_UTILS
      ]
    },
    contains: [
      KNOWN_SHEBANG,
      // to catch known shells and boost relevancy
      hljs.SHEBANG(),
      // to catch unknown shells but still highlight the shebang
      FUNCTION,
      ARITHMETIC,
      COMMENT,
      HERE_DOC,
      PATH_MODE,
      QUOTE_STRING,
      ESCAPED_QUOTE,
      APOS_STRING,
      ESCAPED_APOS,
      VAR
    ]
  };
}

// node_modules/highlight.js/es/languages/cpp.js
function cpp(hljs) {
  const regex = hljs.regex;
  const C_LINE_COMMENT_MODE = hljs.COMMENT("//", "$", { contains: [{ begin: /\\\n/ }] });
  const DECLTYPE_AUTO_RE = "decltype\\(auto\\)";
  const NAMESPACE_RE = "[a-zA-Z_]\\w*::";
  const TEMPLATE_ARGUMENT_RE = "<[^<>]+>";
  const FUNCTION_TYPE_RE = "(?!struct)(" + DECLTYPE_AUTO_RE + "|" + regex.optional(NAMESPACE_RE) + "[a-zA-Z_]\\w*" + regex.optional(TEMPLATE_ARGUMENT_RE) + ")";
  const CPP_PRIMITIVE_TYPES = {
    className: "type",
    begin: "\\b[a-z\\d_]*_t\\b"
  };
  const CHARACTER_ESCAPES = "\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)";
  const STRINGS = {
    className: "string",
    variants: [
      {
        begin: '(u8?|U|L)?"',
        end: '"',
        illegal: "\\n",
        contains: [hljs.BACKSLASH_ESCAPE]
      },
      {
        begin: "(u8?|U|L)?'(" + CHARACTER_ESCAPES + "|.)",
        end: "'",
        illegal: "."
      },
      // https://en.cppreference.com/w/cpp/language/string_literal
      // a d-char-sequence never contains parentheses, backslashes or whitespace;
      // quotes are excluded as well so the closing delimiter cannot swallow the
      // quote that actually terminates the literal
      hljs.END_SAME_AS_BEGIN({
        begin: /(?:u8?|U|L)?R"([^()\\\s"]{0,16})\(/,
        end: /\)([^()\\\s"]{0,16})"/
      })
    ]
  };
  const NUMBERS = {
    className: "number",
    variants: [
      // Floating-point literal.
      {
        begin: "[+-]?(?:(?:\\b[0-9](?:'?[0-9])*\\.(?:[0-9](?:'?[0-9])*)?|\\.[0-9](?:'?[0-9])*)(?:[Ee][+-]?[0-9](?:'?[0-9])*)?|\\b[0-9](?:'?[0-9])*[Ee][+-]?[0-9](?:'?[0-9])*|\\b0[Xx](?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*(?:\\.(?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)?)?|\\.[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)[Pp][+-]?[0-9](?:'?[0-9])*)(?:[Ff](?:16|32|64|128)?|(BF|bf)16|[Ll]|)"
      },
      // Integer literal.
      {
        begin: "[+-]?\\b(?:0[Bb][01](?:'?[01])*|0[Xx][0-9A-Fa-f](?:'?[0-9A-Fa-f])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)(?:[Uu](?:LL?|ll?)|[Uu][Zz]?|(?:LL?|ll?)[Uu]?|[Zz][Uu]|)"
        // Note: there are user-defined literal suffixes too, but perhaps having the custom suffix not part of the
        // literal highlight actually makes it stand out more.
      }
    ],
    relevance: 0
  };
  const PREPROCESSOR_INCLUDE = {
    scope: "meta",
    begin: /#\s*include\b/,
    end: /$/,
    keywords: { keyword: "include" },
    contains: [
      {
        // the `\` at the end of a line signaling continuation
        begin: /\\\n/
      },
      STRINGS,
      {
        scope: "string",
        begin: /<.*?>/
      },
      C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE
    ]
  };
  const PREPROCESSOR = {
    className: "meta",
    begin: /#\s*[a-z]+\b/,
    end: /$/,
    keywords: { keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include" },
    contains: [
      {
        begin: /\\\n/,
        relevance: 0
      },
      hljs.inherit(STRINGS, { className: "string" }),
      C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE
    ]
  };
  const PREPROCESSORS = [
    PREPROCESSOR_INCLUDE,
    PREPROCESSOR
  ];
  const TITLE_MODE = {
    className: "title",
    begin: regex.optional(NAMESPACE_RE) + hljs.IDENT_RE,
    relevance: 0
  };
  const FUNCTION_TITLE = regex.optional(NAMESPACE_RE) + hljs.IDENT_RE + "\\s*\\(";
  const MAX_FUNCTION_TYPE_TOKENS = 12;
  const RESERVED_KEYWORDS = [
    "alignas",
    "alignof",
    "and",
    "and_eq",
    "asm",
    "atomic_cancel",
    "atomic_commit",
    "atomic_noexcept",
    "auto",
    "bitand",
    "bitor",
    "break",
    "case",
    "catch",
    "class",
    "co_await",
    "co_return",
    "co_yield",
    "compl",
    "concept",
    "const_cast|10",
    "consteval",
    "constexpr",
    "constinit",
    "continue",
    "decltype",
    "default",
    "delete",
    "do",
    "dynamic_cast|10",
    "else",
    "enum",
    "explicit",
    "export",
    "extern",
    "false",
    "final",
    "for",
    "friend",
    "goto",
    "if",
    "import",
    "inline",
    "module",
    "mutable",
    "namespace",
    "new",
    "noexcept",
    "not",
    "not_eq",
    "nullptr",
    "operator",
    "or",
    "or_eq",
    "override",
    "private",
    "protected",
    "public",
    "reflexpr",
    "register",
    "reinterpret_cast|10",
    "requires",
    "return",
    "sizeof",
    "static_assert",
    "static_cast|10",
    "struct",
    "switch",
    "synchronized",
    "template",
    "this",
    "thread_local",
    "throw",
    "transaction_safe",
    "transaction_safe_dynamic",
    "true",
    "try",
    "typedef",
    "typeid",
    "typename",
    "union",
    "using",
    "virtual",
    "volatile",
    "while",
    "xor",
    "xor_eq"
  ];
  const RESERVED_TYPES = [
    "bool",
    "char",
    "char16_t",
    "char32_t",
    "char8_t",
    "double",
    "float",
    "int",
    "long",
    "short",
    "void",
    "wchar_t",
    "unsigned",
    "signed",
    "const",
    "static"
  ];
  const TYPE_HINTS = [
    "any",
    "auto_ptr",
    "barrier",
    "binary_semaphore",
    "bitset",
    "complex",
    "condition_variable",
    "condition_variable_any",
    "counting_semaphore",
    "deque",
    "false_type",
    "flat_map",
    "flat_set",
    "future",
    "imaginary",
    "initializer_list",
    "istringstream",
    "jthread",
    "latch",
    "lock_guard",
    "multimap",
    "multiset",
    "mutex",
    "optional",
    "ostringstream",
    "packaged_task",
    "pair",
    "promise",
    "priority_queue",
    "queue",
    "recursive_mutex",
    "recursive_timed_mutex",
    "scoped_lock",
    "set",
    "shared_future",
    "shared_lock",
    "shared_mutex",
    "shared_timed_mutex",
    "shared_ptr",
    "stack",
    "string_view",
    "stringstream",
    "timed_mutex",
    "thread",
    "true_type",
    "tuple",
    "unique_lock",
    "unique_ptr",
    "unordered_map",
    "unordered_multimap",
    "unordered_multiset",
    "unordered_set",
    "variant",
    "vector",
    "weak_ptr",
    "wstring",
    "wstring_view"
  ];
  const FUNCTION_HINTS = [
    "abort",
    "abs",
    "acos",
    "apply",
    "as_const",
    "asin",
    "atan",
    "atan2",
    "calloc",
    "ceil",
    "cerr",
    "cin",
    "clog",
    "cos",
    "cosh",
    "cout",
    "declval",
    "endl",
    "exchange",
    "exit",
    "exp",
    "fabs",
    "floor",
    "fmod",
    "forward",
    "fprintf",
    "fputs",
    "free",
    "frexp",
    "fscanf",
    "future",
    "invoke",
    "isalnum",
    "isalpha",
    "iscntrl",
    "isdigit",
    "isgraph",
    "islower",
    "isprint",
    "ispunct",
    "isspace",
    "isupper",
    "isxdigit",
    "labs",
    "launder",
    "ldexp",
    "log",
    "log10",
    "make_pair",
    "make_shared",
    "make_shared_for_overwrite",
    "make_tuple",
    "make_unique",
    "malloc",
    "memchr",
    "memcmp",
    "memcpy",
    "memset",
    "modf",
    "move",
    "pow",
    "printf",
    "putchar",
    "puts",
    "realloc",
    "scanf",
    "sin",
    "sinh",
    "snprintf",
    "sprintf",
    "sqrt",
    "sscanf",
    "std",
    "stderr",
    "stdin",
    "stdout",
    "strcat",
    "strchr",
    "strcmp",
    "strcpy",
    "strcspn",
    "strlen",
    "strncat",
    "strncmp",
    "strncpy",
    "strpbrk",
    "strrchr",
    "strspn",
    "strstr",
    "swap",
    "tan",
    "tanh",
    "terminate",
    "to_underlying",
    "tolower",
    "toupper",
    "vfprintf",
    "visit",
    "vprintf",
    "vsprintf"
  ];
  const LITERALS = [
    "NULL",
    "false",
    "nullopt",
    "nullptr",
    "true"
  ];
  const BUILT_IN = ["_Pragma"];
  const CPP_KEYWORDS = {
    type: RESERVED_TYPES,
    keyword: RESERVED_KEYWORDS,
    literal: LITERALS,
    built_in: BUILT_IN,
    _type_hints: TYPE_HINTS
  };
  const FUNCTION_DISPATCH = {
    className: "function.dispatch",
    relevance: 0,
    keywords: {
      // Only for relevance, not highlighting.
      _hint: FUNCTION_HINTS
    },
    begin: regex.concat(
      /\b/,
      `(?!${RESERVED_KEYWORDS.join("|")})`,
      hljs.IDENT_RE,
      regex.lookahead(/(<[^<>]+>|)\s*\(/)
    )
  };
  const EXPRESSION_CONTAINS = [
    FUNCTION_DISPATCH,
    ...PREPROCESSORS,
    CPP_PRIMITIVE_TYPES,
    C_LINE_COMMENT_MODE,
    hljs.C_BLOCK_COMMENT_MODE,
    NUMBERS,
    STRINGS
  ];
  const EXPRESSION_CONTEXT = {
    // This mode covers expression context where we can't expect a function
    // definition and shouldn't highlight anything that looks like one:
    // `return some()`, `else if()`, `(x*sum(1, 2))`
    variants: [
      {
        begin: /=/,
        end: /;/
      },
      {
        begin: /\(/,
        end: /\)/
      },
      {
        beginKeywords: "new throw return else",
        end: /;/
      }
    ],
    keywords: CPP_KEYWORDS,
    contains: EXPRESSION_CONTAINS.concat([
      {
        begin: /\(/,
        end: /\)/,
        keywords: CPP_KEYWORDS,
        contains: EXPRESSION_CONTAINS.concat(["self"]),
        relevance: 0
      }
    ]),
    relevance: 0
  };
  const FUNCTION_DECLARATION = {
    className: "function",
    begin: "(" + FUNCTION_TYPE_RE + "[\\*&\\s]+){1," + MAX_FUNCTION_TYPE_TOKENS + "}" + FUNCTION_TITLE,
    returnBegin: true,
    end: /[{;=]/,
    excludeEnd: true,
    keywords: CPP_KEYWORDS,
    illegal: /[^\w\s\*&:<>.]/,
    contains: [
      {
        // to prevent it from being confused as the function title
        begin: DECLTYPE_AUTO_RE,
        keywords: CPP_KEYWORDS,
        relevance: 0
      },
      {
        begin: FUNCTION_TITLE,
        returnBegin: true,
        contains: [TITLE_MODE],
        relevance: 0
      },
      // needed because we do not have look-behind on the below rule
      // to prevent it from grabbing the final : in a :: pair
      {
        begin: /::/,
        relevance: 0
      },
      // initializers
      {
        begin: /:/,
        endsWithParent: true,
        contains: [
          STRINGS,
          NUMBERS
        ]
      },
      // allow for multiple declarations, e.g.:
      // extern void f(int), g(char);
      {
        relevance: 0,
        match: /,/
      },
      {
        className: "params",
        begin: /\(/,
        end: /\)/,
        keywords: CPP_KEYWORDS,
        relevance: 0,
        contains: [
          C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          STRINGS,
          NUMBERS,
          CPP_PRIMITIVE_TYPES,
          // Count matching parentheses.
          {
            begin: /\(/,
            end: /\)/,
            keywords: CPP_KEYWORDS,
            relevance: 0,
            contains: [
              "self",
              C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE,
              STRINGS,
              NUMBERS,
              CPP_PRIMITIVE_TYPES
            ]
          }
        ]
      },
      CPP_PRIMITIVE_TYPES,
      C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      ...PREPROCESSORS
    ]
  };
  return {
    name: "C++",
    aliases: [
      "cc",
      "c++",
      "h++",
      "hpp",
      "hh",
      "hxx",
      "cxx"
    ],
    keywords: CPP_KEYWORDS,
    illegal: "</",
    classNameAliases: { "function.dispatch": "built_in" },
    contains: [].concat(
      EXPRESSION_CONTEXT,
      FUNCTION_DECLARATION,
      FUNCTION_DISPATCH,
      EXPRESSION_CONTAINS,
      [
        ...PREPROCESSORS,
        {
          // containers: ie, `vector <int> rooms (9);`
          begin: "\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function|flat_map|flat_set)\\s*<(?!<)",
          end: ">",
          keywords: CPP_KEYWORDS,
          contains: [
            "self",
            CPP_PRIMITIVE_TYPES
          ]
        },
        {
          begin: hljs.IDENT_RE + "::",
          keywords: CPP_KEYWORDS
        },
        {
          match: [
            // extra complexity to deal with `enum class` and `enum struct`
            /\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,
            /\s+/,
            /\w+/
          ],
          className: {
            1: "keyword",
            3: "title.class"
          }
        }
      ]
    )
  };
}

// node_modules/highlight.js/es/languages/plaintext.js
function plaintext(hljs) {
  return {
    name: "Plain text",
    aliases: [
      "text",
      "txt"
    ],
    disableAutodetect: true
  };
}

// src/client/monaco.ts
var MONACO_BASE = "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs";
var loading = null;
var failed = false;
function loadLoader() {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = `${MONACO_BASE}/loader.js`;
    el.async = true;
    el.addEventListener("load", () => resolve());
    el.addEventListener("error", () => reject(new Error("failed to load monaco loader")));
    document.head.append(el);
  });
}
function ensureMonaco() {
  if (failed) return Promise.reject(new Error("monaco previously failed to load"));
  if (loading) return loading;
  loading = (async () => {
    try {
      await loadLoader();
      await new Promise((resolve, reject) => {
        window.require.config({ paths: { vs: MONACO_BASE } });
        window.require(["vs/editor/editor.main"], () => resolve(), (err) => reject(err));
      });
      return window.monaco;
    } catch (error) {
      failed = true;
      loading = null;
      throw error;
    }
  })();
  return loading;
}

// node_modules/marked/lib/marked.esm.js
function C() {
  return { async: false, breaks: false, extensions: null, gfm: true, hooks: null, pedantic: false, renderer: null, silent: false, tokenizer: null, walkTokens: null };
}
var R = C();
function j(l3) {
  R = l3;
}
var z = { exec: () => null };
function A(l3) {
  let e = [];
  return (t) => {
    let n = Math.max(0, Math.min(3, t - 1)), s = e[n];
    return s || (s = l3(n), e[n] = s), s;
  };
}
function k(l3, e = "") {
  let t = typeof l3 == "string" ? l3 : l3.source, n = { replace: (s, r) => {
    let i = typeof r == "string" ? r : r.source;
    return i = i.replace(m.caret, "$1"), t = t.replace(s, i), n;
  }, getRegex: () => new RegExp(t, e) };
  return n;
}
var Te = ((l3 = "") => {
  try {
    return !!new RegExp("(?<=1)(?<!1)" + l3);
  } catch {
    return false;
  }
})();
var m = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (l3) => new RegExp(`^( {0,3}${l3})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: A((l3) => new RegExp(`^ {0,${l3}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)), hrRegex: A((l3) => new RegExp(`^ {0,${l3}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)), fencesBeginRegex: A((l3) => new RegExp(`^ {0,${l3}}(?:\`\`\`|~~~)`)), headingBeginRegex: A((l3) => new RegExp(`^ {0,${l3}}#`)), htmlBeginRegex: A((l3) => new RegExp(`^ {0,${l3}}<(?:[a-z].*>|!--)`, "i")), blockquoteBeginRegex: A((l3) => new RegExp(`^ {0,${l3}}>`)) };
var Oe = /^(?:[ \t]*(?:\n|$))+/;
var we = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var ye = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var q = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var Pe = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var U = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
var oe = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
var ae = k(oe).replace(/bull/g, U).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
var Se = k(oe).replace(/bull/g, U).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
var K = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/;
var _e = /^[^\n]+/;
var W = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
var $e = k(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", W).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
var Le = k(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g, U).getRegex();
var Q = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var X = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var Me = k("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", X).replace("tag", Q).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var le = (l3) => k(K).replace("hr", q).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~~~)[^\\n]*\\n").replace("list", l3).replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Q).getRegex();
var ze = le(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/);
var Ee = le(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/);
var Ce = k(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Ee).getRegex();
var J = { blockquote: Ce, code: we, def: $e, fences: ye, heading: Pe, hr: q, html: Me, lheading: ae, list: Le, newline: Oe, paragraph: ze, table: z, text: _e };
var se = k("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", q).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~~~)[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Q).getRegex();
var Ae = { ...J, lheading: Se, table: se, paragraph: k(K).replace("hr", q).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", se).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~~~)[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Q).getRegex() };
var Ie = { ...J, html: k(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", X).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: z, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: k(K).replace("hr", q).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ae).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() };
var Be = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var De = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var pe = /^( {2,}|\\)\n(?!\s*$)/;
var qe = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var _ = /[\p{P}\p{S}]/u;
var I = /[\s\p{P}\p{S}]/u;
var v = /[^\s\p{P}\p{S}]/u;
var ve = k(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, I).getRegex();
var He = /[\p{Pi}\p{Ps}"']/u;
var ue = /(?!~)[\p{P}\p{S}]/u;
var Ze = /(?!~)[\s\p{P}\p{S}]/u;
var Ge = /(?:[^\s\p{P}\p{S}]|~)/u;
var Qe = k(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Te ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
var ce = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
var Ne = k(ce, "u").replace(/punct/g, _).getRegex();
var je = k(ce, "u").replace(/punct/g, ue).getRegex();
var Fe = /^(?:\*+(?:((?!\*)(?!openQuote)punct)|([^\s*]))?)|^_+(?:((?!_)(?!openQuote)punct)|([^\s_]))?/;
var Ue = k(Fe, "u").replace(/openQuote/g, He).replace(/punct/g, _).getRegex();
var he = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var Ke = k(he, "gu").replace(/notPunctSpace/g, v).replace(/punctSpace/g, I).replace(/punct/g, _).getRegex();
var We = k(he, "gu").replace(/notPunctSpace/g, Ge).replace(/punctSpace/g, Ze).replace(/punct/g, ue).getRegex();
var Xe = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)[\\s](\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|(?:(?!\\*)punct|notPunctSpace)(\\*+)(?!\\*)(?=notPunctSpace)";
var Je = k(Xe, "gu").replace(/notPunctSpace/g, v).replace(/punctSpace/g, I).replace(/punct/g, _).getRegex();
var Ve = k("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, v).replace(/punctSpace/g, I).replace(/punct/g, _).getRegex();
var Ye = "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)[\\s](_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)|(?:(?!_)punct|notPunctSpace)(_+)(?!_)(?=notPunctSpace)";
var et = k(Ye, "gu").replace(/notPunctSpace/g, v).replace(/punctSpace/g, I).replace(/punct/g, _).getRegex();
var tt = k(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, _).getRegex();
var nt = "^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)";
var rt = k(nt, "gu").replace(/notPunctSpace/g, v).replace(/punctSpace/g, I).replace(/punct/g, _).getRegex();
var st = k(/\\(punct)/, "gu").replace(/punct/g, _).getRegex();
var it = k(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var ot = k(X).replace("(?:-->|$)", "-->").getRegex();
var at = k("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", ot).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var G = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/;
var lt = k(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", G).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
var de = k(/^!?\[(label)\]\[(ref)\]/).replace("label", G).replace("ref", W).getRegex();
var ke = k(/^!?\[(ref)\](?:\[\])?/).replace("ref", W).getRegex();
var pt = k("reflink|nolink(?!\\()", "g").replace("reflink", de).replace("nolink", ke).getRegex();
var ie = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
var V = { _backpedal: z, anyPunctuation: st, autolink: it, blockSkip: Qe, br: pe, code: De, del: z, delLDelim: z, delRDelim: z, emStrongLDelim: Ne, emStrongRDelimAst: Ke, emStrongRDelimUnd: Ve, escape: Be, link: lt, nolink: ke, punctuation: ve, reflink: de, reflinkSearch: pt, tag: at, text: qe, url: z };
var ut = { ...V, emStrongLDelim: Ue, emStrongRDelimAst: Je, emStrongRDelimUnd: et, link: k(/^!?\[(label)\]\((.*?)\)/).replace("label", G).getRegex(), reflink: k(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", G).getRegex() };
var F = { ...V, emStrongRDelimAst: We, emStrongLDelim: je, delLDelim: tt, delRDelim: rt, url: k(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ie).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: k(/^(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ie).getRegex() };
var ct = { ...F, br: k(pe).replace("{2,}", "*").getRegex(), text: k(F.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() };
var H = { normal: J, gfm: Ae, pedantic: Ie };
var B = { normal: V, gfm: F, breaks: ct, pedantic: ut };
var ht = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
var ge = (l3) => ht[l3];
function O(l3, e) {
  if (e) {
    if (m.escapeTest.test(l3)) return l3.replace(m.escapeReplace, ge);
  } else if (m.escapeTestNoEncode.test(l3)) return l3.replace(m.escapeReplaceNoEncode, ge);
  return l3;
}
function Y(l3) {
  try {
    l3 = encodeURI(l3).replace(m.percentDecode, "%");
  } catch {
    return null;
  }
  return l3;
}
function ee(l3, e) {
  let t = l3.replace(m.findPipe, (r, i, o) => {
    let p = false, a = i;
    for (; --a >= 0 && o[a] === "\\"; ) p = !p;
    return p ? "|" : " |";
  }), n = t.split(m.splitPipe), s = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
  else for (; n.length < e; ) n.push("");
  for (; s < n.length; s++) n[s] = n[s].trim().replace(m.slashPipe, "|");
  return n;
}
function $(l3, e, t) {
  let n = l3.length;
  if (n === 0) return "";
  let s = 0;
  for (; s < n; ) {
    let r = l3.charAt(n - s - 1);
    if (r === e && !t) s++;
    else if (r !== e && t) s++;
    else break;
  }
  return l3.slice(0, n - s);
}
function te(l3) {
  let e = l3.split(`
`), t = e.length - 1;
  for (; t >= 0 && m.blankLine.test(e[t]); ) t--;
  return e.length - t <= 2 ? l3 : e.slice(0, t + 1).join(`
`);
}
function fe(l3, e) {
  if (l3.indexOf(e[1]) === -1) return -1;
  let t = 0;
  for (let n = 0; n < l3.length; n++) if (l3[n] === "\\") n++;
  else if (l3[n] === e[0]) t++;
  else if (l3[n] === e[1] && (t--, t < 0)) return n;
  return t > 0 ? -2 : -1;
}
function me(l3, e = 0) {
  let t = e, n = "";
  for (let s of l3) if (s === "	") {
    let r = 4 - t % 4;
    n += " ".repeat(r), t += r;
  } else n += s, t++;
  return n;
}
function xe(l3, e, t, n, s) {
  let r = e.href, i = e.title || null, o = l3[1].replace(s.other.outputLinkReplace, "$1");
  n.state.inLink = true;
  let p = { type: l3[0].charAt(0) === "!" ? "image" : "link", raw: t, href: r, title: i, text: o, tokens: n.inlineTokens(o) };
  return n.state.inLink = false, p;
}
function dt(l3, e, t) {
  let n = l3.match(t.other.indentCodeCompensation);
  if (n === null) return e;
  let s = n[1];
  return e.split(`
`).map((r) => {
    let i = r.match(t.other.beginningSpace);
    if (i === null) return r;
    let [o] = i;
    return o.length >= s.length ? r.slice(s.length) : r;
  }).join(`
`);
}
var y = class {
  constructor(e) {
    __publicField(this, "options");
    __publicField(this, "rules");
    __publicField(this, "lexer");
    this.options = e || R;
  }
  space(e) {
    let t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0) return { type: "space", raw: t[0] };
  }
  code(e) {
    let t = this.rules.block.code.exec(e);
    if (t) {
      let n = this.options.pedantic ? t[0] : te(t[0]), s = n.replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: n, codeBlockStyle: "indented", text: s };
    }
  }
  fences(e) {
    let t = this.rules.block.fences.exec(e);
    if (t) {
      let n = t[0], s = dt(n, t[3] || "", this.rules);
      return { type: "code", raw: n, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: s };
    }
  }
  heading(e) {
    let t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        let s = $(n, "#");
        (this.options.pedantic || !s || this.rules.other.endingSpaceChar.test(s)) && (n = s.trim());
      }
      return { type: "heading", raw: $(t[0], `
`), depth: t[1].length, text: n, tokens: this.lexer.inline(n) };
    }
  }
  hr(e) {
    let t = this.rules.block.hr.exec(e);
    if (t) return { type: "hr", raw: $(t[0], `
`) };
  }
  blockquote(e) {
    let t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = $(t[0], `
`).split(`
`), s = "", r = "", i = [];
      for (; n.length > 0; ) {
        let o = false, p = [], a;
        for (a = 0; a < n.length; a++) if (this.rules.other.blockquoteStart.test(n[a])) p.push(n[a]), o = true;
        else if (!o) p.push(n[a]);
        else break;
        n = n.slice(a);
        let u = p.join(`
`), c = u.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        s = s ? `${s}
${u}` : u, r = r ? `${r}
${c}` : c;
        let h = this.lexer.state.top;
        if (this.lexer.state.top = true, this.lexer.blockTokens(c, i, true), this.lexer.state.top = h, n.length === 0) break;
        let d = i.at(-1);
        if (d?.type === "code") break;
        if (d?.type === "blockquote") {
          let T = d, g = n.join(`
`), w = T.raw + `
` + g.replace(this.rules.other.blockquoteSetextReplace2, ""), M = this.blockquote(w);
          i[i.length - 1] = M, s = `${s}
${g}`, r = r.substring(0, r.length - T.text.length) + M.text;
          break;
        } else if (d?.type === "list") {
          let T = d, g = T.raw + `
` + n.join(`
`), w = this.list(g);
          i[i.length - 1] = w, s = s.substring(0, s.length - d.raw.length) + w.raw, r = r.substring(0, r.length - T.raw.length) + w.raw, n = g.substring(i.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: s, tokens: i, text: r };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim(), s = n.length > 1, r = { type: "list", raw: "", ordered: s, start: s ? +n.slice(0, -1) : "", loose: false, items: [] };
      n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
      let i = this.rules.other.listItemRegex(n), o = false;
      for (; e; ) {
        let a = false, u = "", c = "";
        if (!(t = i.exec(e)) || this.rules.block.hr.test(e)) break;
        u = t[0], e = e.substring(u.length);
        let h = me(t[2].split(`
`, 1)[0], t[1].length), d = e.split(`
`, 1)[0], T = !h.trim(), g = 0;
        if (this.options.pedantic ? (g = 2, c = h.trimStart()) : T ? g = t[1].length + 1 : (g = h.search(this.rules.other.nonSpaceChar), g = g > 4 ? 1 : g, c = h.slice(g), g += t[1].length), T && this.rules.other.blankLine.test(d) && (u += d + `
`, e = e.substring(d.length + 1), a = true), !a) {
          let w = this.rules.other.nextBulletRegex(g), M = this.rules.other.hrRegex(g), ne = this.rules.other.fencesBeginRegex(g), re = this.rules.other.headingBeginRegex(g), be = this.rules.other.htmlBeginRegex(g), Re = this.rules.other.blockquoteBeginRegex(g);
          for (; e; ) {
            let N = e.split(`
`, 1)[0], D;
            if (d = N, this.options.pedantic ? (d = d.replace(this.rules.other.listReplaceNesting, "  "), D = d) : D = d.replace(this.rules.other.tabCharGlobal, "    "), ne.test(d) || re.test(d) || be.test(d) || Re.test(d) || w.test(d) || M.test(d)) break;
            if (D.search(this.rules.other.nonSpaceChar) >= g || !d.trim()) c += `
` + D.slice(g);
            else {
              if (T || h.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ne.test(h) || re.test(h) || M.test(h)) break;
              c += `
` + d;
            }
            T = !d.trim(), u += N + `
`, e = e.substring(N.length + 1), h = D.slice(g);
          }
        }
        r.loose || (o ? r.loose = true : this.rules.other.doubleBlankLine.test(u) && (o = true)), r.items.push({ type: "list_item", raw: u, task: !!this.options.gfm && this.rules.other.listIsTask.test(c), loose: false, text: c, tokens: [] }), r.raw += u;
      }
      let p = r.items.at(-1);
      if (p) p.raw = p.raw.trimEnd(), p.text = p.text.trimEnd();
      else return;
      r.raw = r.raw.trimEnd();
      for (let a of r.items) {
        this.lexer.state.top = false, a.tokens = this.lexer.blockTokens(a.text, []);
        let u = a.tokens[0];
        if (a.task && (u?.type === "text" || u?.type === "paragraph")) {
          a.text = a.text.replace(this.rules.other.listReplaceTask, ""), u.raw = u.raw.replace(this.rules.other.listReplaceTask, ""), u.text = u.text.replace(this.rules.other.listReplaceTask, "");
          for (let h = this.lexer.inlineQueue.length - 1; h >= 0; h--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[h].src)) {
            this.lexer.inlineQueue[h].src = this.lexer.inlineQueue[h].src.replace(this.rules.other.listReplaceTask, "");
            break;
          }
          let c = this.rules.other.listTaskCheckbox.exec(a.raw);
          if (c) {
            let h = { type: "checkbox", raw: c[0] + " ", checked: c[0] !== "[ ]" };
            a.checked = h.checked, r.loose ? a.tokens[0] && ["paragraph", "text"].includes(a.tokens[0].type) && "tokens" in a.tokens[0] && a.tokens[0].tokens ? (a.tokens[0].raw = h.raw + a.tokens[0].raw, a.tokens[0].text = h.raw + a.tokens[0].text, a.tokens[0].tokens.unshift(h)) : a.tokens.unshift({ type: "paragraph", raw: h.raw, text: h.raw, tokens: [h] }) : a.tokens.unshift(h);
          }
        } else a.task && (a.task = false);
        if (!r.loose) {
          let c = a.tokens.filter((d) => d.type === "space"), h = c.length > 0 && c.some((d) => this.rules.other.anyLine.test(d.raw));
          r.loose = h;
        }
      }
      if (r.loose) for (let a of r.items) {
        a.loose = true;
        for (let u of a.tokens) u.type === "text" && (u.type = "paragraph");
      }
      return r;
    }
  }
  html(e) {
    let t = this.rules.block.html.exec(e);
    if (t) {
      let n = te(t[0]);
      return { type: "html", block: true, raw: n, pre: t[1] === "pre" || t[1] === "script" || t[1] === "style", text: n };
    }
  }
  def(e) {
    let t = this.rules.block.def.exec(e);
    if (t) {
      let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), s = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return { type: "def", tag: n, raw: $(t[0], `
`), href: s, title: r };
    }
  }
  table(e) {
    let t = this.rules.block.table.exec(e);
    if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
    let n = ee(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), r = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], i = { type: "table", raw: $(t[0], `
`), header: [], align: [], rows: [] };
    if (n.length === s.length) {
      for (let o of s) this.rules.other.tableAlignRight.test(o) ? i.align.push("right") : this.rules.other.tableAlignCenter.test(o) ? i.align.push("center") : this.rules.other.tableAlignLeft.test(o) ? i.align.push("left") : i.align.push(null);
      for (let o = 0; o < n.length; o++) i.header.push({ text: n[o], tokens: this.lexer.inline(n[o]), header: true, align: i.align[o] });
      for (let o of r) i.rows.push(ee(o, i.header.length).map((p, a) => ({ text: p, tokens: this.lexer.inline(p), header: false, align: i.align[a] })));
      return i;
    }
  }
  lheading(e) {
    let t = this.rules.block.lheading.exec(e);
    if (t) {
      let n = t[1].trim();
      return { type: "heading", raw: $(t[0], `
`), depth: t[2].charAt(0) === "=" ? 1 : 2, text: n, tokens: this.lexer.inline(n) };
    }
  }
  paragraph(e) {
    let t = this.rules.block.paragraph.exec(e);
    if (t) {
      let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return { type: "paragraph", raw: t[0], text: n, tokens: this.lexer.inline(n) };
    }
  }
  text(e) {
    let t = this.rules.block.text.exec(e);
    if (t) return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) };
  }
  escape(e) {
    let t = this.rules.inline.escape.exec(e);
    if (t) return { type: "escape", raw: t[0], text: t[1] };
  }
  tag(e) {
    let t = this.rules.inline.tag.exec(e);
    if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = true : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = false), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = true : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = false), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: false, text: t[0] };
  }
  link(e) {
    let t = this.rules.inline.link.exec(e);
    if (t) {
      let n = t[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
        if (!this.rules.other.endAngleBracket.test(n)) return;
        let i = $(n.slice(0, -1), "\\");
        if ((n.length - i.length) % 2 === 0) return;
      } else {
        let i = fe(t[2], "()");
        if (i === -2) return;
        if (i > -1) {
          let p = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + i;
          t[2] = t[2].substring(0, i), t[0] = t[0].substring(0, p).trim(), t[3] = "";
        }
      }
      let s = t[2], r = "";
      if (this.options.pedantic) {
        let i = this.rules.other.pedanticHrefTitle.exec(s);
        i && (s = i[1], r = i[3]);
      } else r = t[3] ? t[3].slice(1, -1) : "";
      return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), xe(t, { href: s && s.replace(this.rules.inline.anyPunctuation, "$1"), title: r && r.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      let s = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), r = t[s.toLowerCase()];
      if (!r) {
        let i = n[0].charAt(0);
        return { type: "text", raw: i, text: i };
      }
      return xe(n, r, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || !s[1] && !s[2] && !s[3] && !s[4] || s[4] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
    if (!(s[1] || s[3] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let i = [...s[0]].length - 1, o, p, a = i, u = 0, c = s[0][0], h = n === c, d = c === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (d.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = d.exec(t)) !== null; ) {
        if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o) continue;
        if (p = [...o].length, s[3] || s[4]) {
          a += p;
          continue;
        } else if (s[5] || s[6]) {
          if (i % 3 && !((i + p) % 3)) {
            u += p;
            continue;
          }
          if (h) break;
        }
        if (a -= p, a > 0) continue;
        p = Math.min(p, p + a + u);
        let T = [...s[0]][0].length, g = e.slice(0, i + s.index + T + p);
        if (Math.min(i, p) % 2) {
          let M = g.slice(1, -1);
          return { type: "em", raw: g, text: M, tokens: this.lexer.inlineTokens(M) };
        }
        let w = g.slice(2, -2);
        return { type: "strong", raw: g, text: w, tokens: this.lexer.inlineTokens(w) };
      }
    }
  }
  codespan(e) {
    let t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), s = this.rules.other.nonSpaceChar.test(n), r = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return s && r && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: t[0], text: n };
    }
  }
  br(e) {
    let t = this.rules.inline.br.exec(e);
    if (t) return { type: "br", raw: t[0] };
  }
  del(e, t, n = "") {
    let s = this.rules.inline.delLDelim.exec(e);
    if (!s) return;
    if (!(s[1] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let i = [...s[0]].length - 1, o, p, a = i, u = this.rules.inline.delRDelim;
      for (u.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = u.exec(t)) !== null; ) {
        if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o || (p = [...o].length, p !== i)) continue;
        if (s[3] || s[4]) {
          a += p;
          continue;
        }
        if (a -= p, a > 0) continue;
        p = Math.min(p, p + a);
        let c = [...s[0]][0].length, h = e.slice(0, i + s.index + c + p), d = h.slice(i, -i);
        return { type: "del", raw: h, text: d, tokens: this.lexer.inlineTokens(d) };
      }
    }
  }
  autolink(e) {
    let t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, s;
      return t[2] === "@" ? (n = t[1], s = "mailto:" + n) : (n = t[1], s = n), { type: "link", raw: t[0], text: n, href: s, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  url(e) {
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let n, s;
      if (t[2] === "@") n = t[0], s = "mailto:" + n;
      else {
        let r;
        do
          r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
        while (r !== t[0]);
        n = t[0], t[1] === "www." ? s = "http://" + t[0] : s = t[0];
      }
      return { type: "link", raw: t[0], text: n, href: s, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  inlineText(e) {
    let t = this.rules.inline.text.exec(e);
    if (t) {
      let n = this.lexer.state.inRawBlock;
      return { type: "text", raw: t[0], text: t[0], escaped: n };
    }
  }
};
var x = class l {
  constructor(e) {
    __publicField(this, "tokens");
    __publicField(this, "options");
    __publicField(this, "state");
    __publicField(this, "inlineQueue");
    __publicField(this, "tokenizer");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || R, this.options.tokenizer = this.options.tokenizer || new y(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: false, inRawBlock: false, top: true };
    let t = { other: m, block: H.normal, inline: B.normal };
    this.options.pedantic ? (t.block = H.pedantic, t.inline = B.pedantic) : this.options.gfm && (t.block = H.gfm, this.options.breaks ? t.inline = B.breaks : t.inline = B.gfm), this.tokenizer.rules = t;
  }
  static get rules() {
    return { block: H, inline: B };
  }
  static lex(e, t) {
    return new l(t).lex(e);
  }
  static lexInline(e, t) {
    return new l(t).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      let n = this.inlineQueue[t];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], n = false) {
    this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, ""));
    let s = 1 / 0;
    for (; e; ) {
      if (e.length < s) s = e.length;
      else {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
      let r;
      if (this.options.extensions?.block?.some((o) => (r = o.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), true) : false)) continue;
      if (r = this.tokenizer.space(e)) {
        e = e.substring(r.raw.length);
        let o = t.at(-1);
        r.raw.length === 1 && o !== void 0 ? o.raw += `
` : t.push(r);
        continue;
      }
      if (r = this.tokenizer.code(e)) {
        e = e.substring(r.raw.length);
        let o = t.at(-1);
        o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.at(-1).src = o.text) : t.push(r);
        continue;
      }
      if (r = this.tokenizer.fences(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.heading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.hr(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.blockquote(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.list(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.html(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.def(e)) {
        e = e.substring(r.raw.length);
        let o = t.at(-1);
        o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.raw, this.inlineQueue.at(-1).src = o.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title }, t.push(r));
        continue;
      }
      if (r = this.tokenizer.table(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.lheading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      let i = e;
      if (this.options.extensions?.startBlock) {
        let o = 1 / 0, p = e.slice(1), a;
        this.options.extensions.startBlock.forEach((u) => {
          a = u.call({ lexer: this }, p), typeof a == "number" && a >= 0 && (o = Math.min(o, a));
        }), o < 1 / 0 && o >= 0 && (i = e.substring(0, o + 1));
      }
      if (this.state.top && (r = this.tokenizer.paragraph(i))) {
        let o = t.at(-1);
        n && o?.type === "paragraph" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
        continue;
      }
      if (r = this.tokenizer.text(e)) {
        e = e.substring(r.raw.length);
        let o = t.at(-1);
        o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r);
        continue;
      }
      if (e) {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
    }
    return this.state.top = true, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({ src: e, tokens: t }), t;
  }
  inlineTokens(e, t = []) {
    this.tokenizer.lexer = this;
    let n = e;
    if (this.tokens.links) {
      let o = Object.keys(this.tokens.links);
      o.length > 0 && (n = n.replace(this.tokenizer.rules.inline.reflinkSearch, (p) => o.includes(p.slice(p.lastIndexOf("[") + 1, -1)) ? "[" + "a".repeat(p.length - 2) + "]" : p));
    }
    n = n.replace(this.tokenizer.rules.inline.anyPunctuation, "++"), n = n.replace(this.tokenizer.rules.inline.blockSkip, (o, p, a) => {
      let u = a ? a.length : 0;
      return o.slice(0, u) + "[" + "a".repeat(o.length - u - 2) + "]";
    }), n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
    let s = false, r = "", i = 1 / 0;
    for (; e; ) {
      if (e.length < i) i = e.length;
      else {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
      s || (r = ""), s = false;
      let o;
      if (this.options.extensions?.inline?.some((a) => (o = a.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), true) : false)) continue;
      if (o = this.tokenizer.escape(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.tag(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.link(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(o.raw.length);
        let a = t.at(-1);
        o.type === "text" && a?.type === "text" ? (a.raw += o.raw, a.text += o.text) : t.push(o);
        continue;
      }
      if (o = this.tokenizer.emStrong(e, n, r)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.codespan(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.br(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.del(e, n, r)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.autolink(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (!this.state.inLink && (o = this.tokenizer.url(e))) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      let p = e;
      if (this.options.extensions?.startInline) {
        let a = 1 / 0, u = e.slice(1), c;
        this.options.extensions.startInline.forEach((h) => {
          c = h.call({ lexer: this }, u), typeof c == "number" && c >= 0 && (a = Math.min(a, c));
        }), a < 1 / 0 && a >= 0 && (p = e.substring(0, a + 1));
      }
      if (o = this.tokenizer.inlineText(p)) {
        e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (r = o.raw.slice(-1)), s = true;
        let a = t.at(-1);
        a?.type === "text" ? (a.raw += o.raw, a.text += o.text) : t.push(o);
        continue;
      }
      if (e) {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
    }
    return t;
  }
  infiniteLoopError(e) {
    let t = "Infinite loop on byte: " + e;
    if (this.options.silent) console.error(t);
    else throw new Error(t);
  }
};
var P = class {
  constructor(e) {
    __publicField(this, "options");
    __publicField(this, "parser");
    this.options = e || R;
  }
  space(e) {
    return "";
  }
  code({ text: e, lang: t, escaped: n }) {
    let s = (t || "").match(m.notSpaceStart)?.[0], r = e.replace(m.endingNewline, "") + `
`;
    return s ? '<pre><code class="language-' + O(s) + '">' + (n ? r : O(r, true)) + `</code></pre>
` : "<pre><code>" + (n ? r : O(r, true)) + `</code></pre>
`;
  }
  blockquote({ tokens: e }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({ text: e }) {
    return e;
  }
  def(e) {
    return "";
  }
  heading({ tokens: e, depth: t }) {
    return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    let t = e.ordered, n = e.start, s = "";
    for (let o = 0; o < e.items.length; o++) {
      let p = e.items[o];
      s += this.listitem(p);
    }
    let r = t ? "ol" : "ul", i = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + r + i + `>
` + s + "</" + r + `>
`;
  }
  listitem(e) {
    return `<li>${this.parser.parse(e.tokens)}</li>
`;
  }
  checkbox({ checked: e }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({ tokens: e }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let t = "", n = "";
    for (let r = 0; r < e.header.length; r++) n += this.tablecell(e.header[r]);
    t += this.tablerow({ text: n });
    let s = "";
    for (let r = 0; r < e.rows.length; r++) {
      let i = e.rows[r];
      n = "";
      for (let o = 0; o < i.length; o++) n += this.tablecell(i[o]);
      s += this.tablerow({ text: n });
    }
    return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + s + `</table>
`;
  }
  tablerow({ text: e }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
    return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
  }
  strong({ tokens: e }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({ tokens: e }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({ text: e }) {
    return `<code>${O(e, true)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({ tokens: e }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({ href: e, title: t, tokens: n }) {
    let s = this.parser.parseInline(n), r = Y(e);
    if (r === null) return s;
    e = r;
    let i = '<a href="' + e + '"';
    return t && (i += ' title="' + O(t) + '"'), i += ">" + s + "</a>", i;
  }
  image({ href: e, title: t, text: n, tokens: s }) {
    s && (n = this.parser.parseInline(s, this.parser.textRenderer));
    let r = Y(e);
    if (r === null) return O(n);
    e = r;
    let i = `<img src="${e}" alt="${O(n)}"`;
    return t && (i += ` title="${O(t)}"`), i += ">", i;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : O(e.text);
  }
};
var L = class {
  strong({ text: e }) {
    return e;
  }
  em({ text: e }) {
    return e;
  }
  codespan({ text: e }) {
    return e;
  }
  del({ text: e }) {
    return e;
  }
  html({ text: e }) {
    return e;
  }
  text({ text: e }) {
    return e;
  }
  link({ text: e }) {
    return "" + e;
  }
  image({ text: e }) {
    return "" + e;
  }
  br() {
    return "";
  }
  checkbox({ raw: e }) {
    return e;
  }
};
var b = class l2 {
  constructor(e) {
    __publicField(this, "options");
    __publicField(this, "renderer");
    __publicField(this, "textRenderer");
    this.options = e || R, this.options.renderer = this.options.renderer || new P(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new L();
  }
  static parse(e, t) {
    return new l2(t).parse(e);
  }
  static parseInline(e, t) {
    return new l2(t).parseInline(e);
  }
  parse(e) {
    this.renderer.parser = this;
    let t = "";
    for (let n = 0; n < e.length; n++) {
      let s = e[n];
      if (this.options.extensions?.renderers?.[s.type]) {
        let i = s, o = this.options.extensions.renderers[i.type].call({ parser: this }, i);
        if (o !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "checkbox", "html", "def", "paragraph", "text"].includes(i.type)) {
          t += o || "";
          continue;
        }
      }
      let r = s;
      switch (r.type) {
        case "space": {
          t += this.renderer.space(r);
          break;
        }
        case "hr": {
          t += this.renderer.hr(r);
          break;
        }
        case "heading": {
          t += this.renderer.heading(r);
          break;
        }
        case "code": {
          t += this.renderer.code(r);
          break;
        }
        case "table": {
          t += this.renderer.table(r);
          break;
        }
        case "blockquote": {
          t += this.renderer.blockquote(r);
          break;
        }
        case "list": {
          t += this.renderer.list(r);
          break;
        }
        case "checkbox": {
          t += this.renderer.checkbox(r);
          break;
        }
        case "html": {
          t += this.renderer.html(r);
          break;
        }
        case "def": {
          t += this.renderer.def(r);
          break;
        }
        case "paragraph": {
          t += this.renderer.paragraph(r);
          break;
        }
        case "text": {
          t += this.renderer.text(r);
          break;
        }
        default: {
          let i = 'Token with "' + r.type + '" type was not found.';
          if (this.options.silent) return console.error(i), "";
          throw new Error(i);
        }
      }
    }
    return t;
  }
  parseInline(e, t = this.renderer) {
    this.renderer.parser = this;
    let n = "";
    for (let s = 0; s < e.length; s++) {
      let r = e[s];
      if (this.options.extensions?.renderers?.[r.type]) {
        let o = this.options.extensions.renderers[r.type].call({ parser: this }, r);
        if (o !== false || !["escape", "html", "link", "image", "checkbox", "strong", "em", "codespan", "br", "del", "text"].includes(r.type)) {
          n += o || "";
          continue;
        }
      }
      let i = r;
      switch (i.type) {
        case "escape": {
          n += t.text(i);
          break;
        }
        case "html": {
          n += t.html(i);
          break;
        }
        case "link": {
          n += t.link(i);
          break;
        }
        case "image": {
          n += t.image(i);
          break;
        }
        case "checkbox": {
          n += t.checkbox(i);
          break;
        }
        case "strong": {
          n += t.strong(i);
          break;
        }
        case "em": {
          n += t.em(i);
          break;
        }
        case "codespan": {
          n += t.codespan(i);
          break;
        }
        case "br": {
          n += t.br(i);
          break;
        }
        case "del": {
          n += t.del(i);
          break;
        }
        case "text": {
          n += t.text(i);
          break;
        }
        default: {
          let o = 'Token with "' + i.type + '" type was not found.';
          if (this.options.silent) return console.error(o), "";
          throw new Error(o);
        }
      }
    }
    return n;
  }
};
var _a;
var S = (_a = class {
  constructor(e) {
    __publicField(this, "options");
    __publicField(this, "block");
    this.options = e || R;
  }
  preprocess(e) {
    return e;
  }
  postprocess(e) {
    return e;
  }
  processAllTokens(e) {
    return e;
  }
  emStrongMask(e) {
    return e;
  }
  provideLexer(e = this.block) {
    return e ? x.lex : x.lexInline;
  }
  provideParser(e = this.block) {
    return e ? b.parse : b.parseInline;
  }
}, __publicField(_a, "passThroughHooks", /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"])), __publicField(_a, "passThroughHooksRespectAsync", /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"])), _a);
var Z = class {
  constructor(...e) {
    __publicField(this, "defaults", C());
    __publicField(this, "options", this.setOptions);
    __publicField(this, "parse", this.parseMarkdown(true));
    __publicField(this, "parseInline", this.parseMarkdown(false));
    __publicField(this, "Parser", b);
    __publicField(this, "Renderer", P);
    __publicField(this, "TextRenderer", L);
    __publicField(this, "Lexer", x);
    __publicField(this, "Tokenizer", y);
    __publicField(this, "Hooks", S);
    this.use(...e);
  }
  walkTokens(e, t) {
    let n = [];
    for (let s of e) switch (n = n.concat(t.call(this, s)), s.type) {
      case "table": {
        let r = s;
        for (let i of r.header) n = n.concat(this.walkTokens(i.tokens, t));
        for (let i of r.rows) for (let o of i) n = n.concat(this.walkTokens(o.tokens, t));
        break;
      }
      case "list": {
        let r = s;
        n = n.concat(this.walkTokens(r.items, t));
        break;
      }
      default: {
        let r = s;
        this.defaults.extensions?.childTokens?.[r.type] ? this.defaults.extensions.childTokens[r.type].forEach((i) => {
          let o = r[i].flat(1 / 0);
          n = n.concat(this.walkTokens(o, t));
        }) : r.tokens && (n = n.concat(this.walkTokens(r.tokens, t)));
      }
    }
    return n;
  }
  use(...e) {
    let t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((n) => {
      let s = { ...n };
      if (s.async = this.defaults.async || s.async || false, n.extensions && (n.extensions.forEach((r) => {
        if (!r.name) throw new Error("extension name required");
        if ("renderer" in r) {
          let i = t.renderers[r.name];
          i ? t.renderers[r.name] = function(...o) {
            let p = r.renderer.apply(this, o);
            return p === false && (p = i.apply(this, o)), p;
          } : t.renderers[r.name] = r.renderer;
        }
        if ("tokenizer" in r) {
          if (!r.level || r.level !== "block" && r.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let i = t[r.level];
          i ? i.unshift(r.tokenizer) : t[r.level] = [r.tokenizer], r.start && (r.level === "block" ? t.startBlock ? t.startBlock.push(r.start) : t.startBlock = [r.start] : r.level === "inline" && (t.startInline ? t.startInline.push(r.start) : t.startInline = [r.start]));
        }
        "childTokens" in r && r.childTokens && (t.childTokens[r.name] = r.childTokens);
      }), s.extensions = t), n.renderer) {
        let r = this.defaults.renderer || new P(this.defaults);
        for (let i in n.renderer) {
          if (!(i in r)) throw new Error(`renderer '${i}' does not exist`);
          if (["options", "parser"].includes(i)) continue;
          let o = i, p = n.renderer[o], a = r[o];
          r[o] = (...u) => {
            let c = p.apply(r, u);
            return c === false && (c = a.apply(r, u)), c || "";
          };
        }
        s.renderer = r;
      }
      if (n.tokenizer) {
        let r = this.defaults.tokenizer || new y(this.defaults);
        for (let i in n.tokenizer) {
          if (!(i in r)) throw new Error(`tokenizer '${i}' does not exist`);
          if (["options", "rules", "lexer"].includes(i)) continue;
          let o = i, p = n.tokenizer[o], a = r[o];
          r[o] = (...u) => {
            let c = p.apply(r, u);
            return c === false && (c = a.apply(r, u)), c;
          };
        }
        s.tokenizer = r;
      }
      if (n.hooks) {
        let r = this.defaults.hooks || new S();
        for (let i in n.hooks) {
          if (!(i in r)) throw new Error(`hook '${i}' does not exist`);
          if (["options", "block"].includes(i)) continue;
          let o = i, p = n.hooks[o], a = r[o];
          S.passThroughHooks.has(i) ? r[o] = (u) => {
            if (this.defaults.async && S.passThroughHooksRespectAsync.has(i)) return (async () => {
              let h = await p.call(r, u);
              return a.call(r, h);
            })();
            let c = p.call(r, u);
            return a.call(r, c);
          } : r[o] = (...u) => {
            if (this.defaults.async) return (async () => {
              let h = await p.apply(r, u);
              return h === false && (h = await a.apply(r, u)), h;
            })();
            let c = p.apply(r, u);
            return c === false && (c = a.apply(r, u)), c;
          };
        }
        s.hooks = r;
      }
      if (n.walkTokens) {
        let r = this.defaults.walkTokens, i = n.walkTokens;
        s.walkTokens = function(o) {
          let p = [];
          return p.push(i.call(this, o)), r && (p = p.concat(r.call(this, o))), p;
        };
      }
      this.defaults = { ...this.defaults, ...s };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return x.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return b.parse(e, t ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, s) => {
      let r = { ...s }, i = { ...this.defaults, ...r }, o = this.onError(!!i.silent, !!i.async);
      if (this.defaults.async === true && r.async === false) return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null) return o(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string") return o(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      if (i.hooks && (i.hooks.options = i, i.hooks.block = e), i.async) return (async () => {
        let p = i.hooks ? await i.hooks.preprocess(n) : n, u = await (i.hooks ? await i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(p, i), c = i.hooks ? await i.hooks.processAllTokens(u) : u;
        i.walkTokens && await Promise.all(this.walkTokens(c, i.walkTokens));
        let d = await (i.hooks ? await i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(c, i);
        return i.hooks ? await i.hooks.postprocess(d) : d;
      })().catch(o);
      try {
        i.hooks && (n = i.hooks.preprocess(n));
        let a = (i.hooks ? i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(n, i);
        i.hooks && (a = i.hooks.processAllTokens(a)), i.walkTokens && this.walkTokens(a, i.walkTokens);
        let c = (i.hooks ? i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(a, i);
        return i.hooks && (c = i.hooks.postprocess(c)), c;
      } catch (p) {
        return o(p);
      }
    };
  }
  onError(e, t) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        let s = "<p>An error occurred:</p><pre>" + O(n.message + "", true) + "</pre>";
        return t ? Promise.resolve(s) : s;
      }
      if (t) return Promise.reject(n);
      throw n;
    };
  }
};
var E = new Z();
function f(l3, e) {
  return E.parse(l3, e);
}
f.options = f.setOptions = function(l3) {
  return E.setOptions(l3), f.defaults = E.defaults, j(f.defaults), f;
};
f.getDefaults = C;
f.defaults = R;
function kt(...l3) {
  return E.use(...l3), f.defaults = E.defaults, j(f.defaults), f;
}
f.use = kt;
f.walkTokens = function(l3, e) {
  return E.walkTokens(l3, e);
};
f.parseInline = E.parseInline;
f.Parser = b;
f.parser = b.parse;
f.Renderer = P;
f.TextRenderer = L;
f.Lexer = x;
f.lexer = x.lex;
f.Tokenizer = y;
f.Hooks = S;
f.parse = f;
var nn = f.options;
var rn = f.setOptions;
var sn = f.walkTokens;
var on = f.parseInline;
var ln = b.parse;
var pn = x.lex;

// src/client/markdown.ts
function renderMarkdown(text) {
  try {
    const html = f.parse(text, { gfm: true, breaks: true });
    return typeof html === "string" ? html : String(html);
  } catch {
    return `<pre>${escapeHtml(text)}</pre>`;
  }
}
function isMarkdownPath(path) {
  const dot = path.lastIndexOf(".");
  if (dot <= 0) return false;
  const ext = path.slice(dot + 1).toLowerCase();
  return ext === "md" || ext === "markdown";
}
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// src/client/mdModeStore.ts
var import_react4 = require("react");
var DEFAULT_MD_MODE = "preview";
var MD_MODE_STORAGE_KEY = "dsh-file:md-mode:v1";
var VALID = /* @__PURE__ */ new Set(["preview", "source"]);
function loadMdMode(storage) {
  try {
    const raw = storage?.getItem(MD_MODE_STORAGE_KEY);
    return raw !== null && raw !== void 0 && VALID.has(raw) ? raw : DEFAULT_MD_MODE;
  } catch {
    return DEFAULT_MD_MODE;
  }
}
function persistMdMode(mode, storage) {
  try {
    storage?.setItem(MD_MODE_STORAGE_KEY, mode);
  } catch {
  }
}
var current = loadMdMode(safeStorage());
var listeners2 = /* @__PURE__ */ new Set();
function emit2() {
  for (const listener of listeners2) listener();
}
function safeStorage() {
  try {
    return typeof localStorage !== "undefined" ? localStorage : void 0;
  } catch {
    return void 0;
  }
}
function subscribe2(listener) {
  listeners2.add(listener);
  return () => {
    listeners2.delete(listener);
  };
}
function snapshot2() {
  return current;
}
function useMdMode() {
  return (0, import_react4.useSyncExternalStore)(subscribe2, snapshot2);
}
function setMdMode(mode) {
  current = mode;
  const storage = safeStorage();
  if (storage !== void 0) persistMdMode(mode, storage);
  emit2();
}

// src/client/themeStore.ts
var import_react5 = require("react");
var EDITOR_THEME_PRESETS = {
  light: { background: "#ffffff", foreground: "#1f2328", fontSize: 13 },
  dark: { background: "#1e1e1e", foreground: "#d4d4d4", fontSize: 13 },
  "one-dark": { background: "#282c34", foreground: "#abb2bf", fontSize: 13 },
  github: { background: "#ffffff", foreground: "#24292e", fontSize: 13 }
};
var EDITOR_THEME_PRESET_ORDER = ["light", "dark", "one-dark", "github"];
var EDITOR_THEME_PRESET_LABELS = {
  light: "\u6D45\u8272",
  dark: "\u6DF1\u8272",
  "one-dark": "One Dark",
  github: "GitHub"
};
var DEFAULT_EDITOR_THEME = { ...EDITOR_THEME_PRESETS.light };
function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n) || h.length !== 6) return [0, 0, 0];
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function rgbToHex(r, g, b2) {
  const c = (x2) => Math.max(0, Math.min(255, Math.round(x2))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b2)}`;
}
function mixColors(a, b2, amount) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b2);
  return rgbToHex(ar + (br - ar) * amount, ag + (bg - ag) * amount, ab + (bb - ab) * amount);
}
function luminanceOf(hex) {
  const [r, g, b2] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b2) / 255;
}
function isLightColor(hex) {
  return luminanceOf(hex) > 0.5;
}
function themeChrome(theme) {
  const light = isLightColor(theme.background);
  const chrome = mixColors(theme.background, light ? "#000000" : "#ffffff", light ? 0.06 : 0.08);
  const border = mixColors(theme.background, light ? "#000000" : "#ffffff", light ? 0.22 : 0.18);
  const muted = mixColors(theme.foreground, theme.background, 0.45);
  const chip = mixColors(theme.background, light ? "#000000" : "#ffffff", light ? 0.05 : 0.06);
  const dirty = light ? "#c2410c" : "#e2c08d";
  return { chrome, border, muted, chip, dirty };
}
var STORAGE_KEY = "dsh-file:editor-theme:v2";
var HEX6 = /^#[0-9a-f]{6}$/i;
function load() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.background === "string" && HEX6.test(parsed.background) && typeof parsed?.foreground === "string" && HEX6.test(parsed.foreground)) {
          return {
            background: parsed.background.toLowerCase(),
            foreground: parsed.foreground.toLowerCase(),
            fontSize: typeof parsed.fontSize === "number" && parsed.fontSize > 0 ? parsed.fontSize : 13
          };
        }
      }
    }
  } catch {
  }
  return { ...DEFAULT_EDITOR_THEME };
}
var current2 = load();
var listeners3 = /* @__PURE__ */ new Set();
function emit3() {
  for (const listener of listeners3) listener();
}
function subscribe3(listener) {
  listeners3.add(listener);
  return () => {
    listeners3.delete(listener);
  };
}
function snapshot3() {
  return current2;
}
function useEditorTheme() {
  return (0, import_react5.useSyncExternalStore)(subscribe3, snapshot3);
}
function setEditorTheme(partial) {
  current2 = { ...current2, ...partial };
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(current2));
  } catch {
  }
  emit3();
}
function resetEditorTheme() {
  current2 = { ...DEFAULT_EDITOR_THEME };
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
  emit3();
}
function presetIdOf(theme) {
  for (const [id, preset] of Object.entries(EDITOR_THEME_PRESETS)) {
    if (preset.background === theme.background && preset.foreground === theme.foreground) return id;
  }
  return void 0;
}
function exportThemeText(theme, name) {
  return JSON.stringify({
    name,
    type: "dsh-file-theme",
    version: 1,
    background: theme.background,
    foreground: theme.foreground,
    fontSize: theme.fontSize,
    colors: {
      "editor.background": theme.background,
      "editor.foreground": theme.foreground
    }
  }, null, 2);
}
function parseImportedTheme(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("\u6587\u4EF6\u4E0D\u662F\u6709\u6548\u7684 JSON");
  }
  if (typeof data !== "object" || data === null) throw new Error("JSON \u5185\u5BB9\u5FC5\u987B\u662F\u5BF9\u8C61");
  const obj = data;
  let background = typeof obj.background === "string" ? obj.background : void 0;
  let foreground = typeof obj.foreground === "string" ? obj.foreground : void 0;
  if ((background === void 0 || foreground === void 0) && typeof obj.colors === "object" && obj.colors !== null) {
    const colors = obj.colors;
    if (background === void 0) background = typeof colors["editor.background"] === "string" ? colors["editor.background"] : void 0;
    if (foreground === void 0) foreground = typeof colors["editor.foreground"] === "string" ? colors["editor.foreground"] : void 0;
  }
  if (background === void 0 || !HEX6.test(background)) {
    throw new Error('\u7F3A\u5C11\u6709\u6548\u7684\u80CC\u666F\u8272\uFF08background \u6216 colors["editor.background"]\uFF0C\u9700\u8981 #rrggbb\uFF09');
  }
  if (foreground === void 0 || !HEX6.test(foreground)) {
    throw new Error('\u7F3A\u5C11\u6709\u6548\u7684\u6587\u5B57\u8272\uFF08foreground \u6216 colors["editor.foreground"]\uFF0C\u9700\u8981 #rrggbb\uFF09');
  }
  const fontSize = typeof obj.fontSize === "number" && obj.fontSize > 0 ? obj.fontSize : 13;
  const name = typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : void 0;
  return { name, background: background.toLowerCase(), foreground: foreground.toLowerCase(), fontSize };
}

// src/client/FileEditorView.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
core_default.registerLanguage("bash", bash);
core_default.registerLanguage("cpp", cpp);
core_default.registerLanguage("plaintext", plaintext);
function fallbackLanguage(path) {
  const filename = path.split(/[\\/]/).pop()?.toLowerCase() ?? "";
  if (filename === "cmakelists.txt" || filename.endsWith(".cmake")) return "bash";
  const ext = filename.split(".").pop() ?? "";
  if (["c", "h"].includes(ext)) return "cpp";
  if (["cpp", "cc", "cxx", "hpp", "hh", "hxx", "inl", "ipp", "tpp"].includes(ext)) return "cpp";
  if (["sh", "bash", "zsh"].includes(ext)) return "bash";
  return "plaintext";
}
function highlightFallback(path, content) {
  try {
    return core_default.highlight(content, { language: fallbackLanguage(path), ignoreIllegals: true }).value;
  } catch {
    return content.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character] ?? character);
  }
}
function cx3(...parts) {
  return parts.filter(Boolean).join(" ");
}
function FileEditorView({ remote, t }) {
  const tabs2 = useTabs();
  const activePath2 = useActivePath();
  const active = activePath2 === null ? void 0 : tabs2.find((t2) => t2.path === activePath2);
  const [busy, setBusy] = (0, import_react6.useState)(false);
  const [notice, setNotice] = (0, import_react6.useState)(null);
  const theme = useEditorTheme();
  const chrome = themeChrome(theme);
  const mdMode = useMdMode();
  (0, import_react6.useEffect)(() => {
    setEditorViewActive(true);
    return () => setEditorViewActive(false);
  }, []);
  const saveActive = (0, import_react6.useCallback)(async () => {
    if (active === void 0 || !active.dirty) return;
    setBusy(true);
    try {
      await unwrap(await remote.writeText(active.path, active.content));
      markSaved(active.path);
      setNotice(`\u5DF2\u4FDD\u5B58 ${active.path.split("/").pop()}`);
    } catch (error) {
      setNotice(`\u4FDD\u5B58\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  }, [active, remote]);
  const saveRef = (0, import_react6.useRef)(saveActive);
  saveRef.current = saveActive;
  (0, import_react6.useEffect)(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const themeVars = {
    "--dshf-bg": theme.background,
    "--dshf-fg": theme.foreground,
    "--dshf-chrome": chrome.chrome,
    "--dshf-border": chrome.border,
    "--dshf-muted": chrome.muted,
    "--dshf-chip": chrome.chip,
    "--dshf-dirty": chrome.dirty,
    "--dshf-accent": "#094771",
    "--dshf-font-size": `${theme.fontSize}px`
  };
  if (active === void 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshf-editor-view", style: themeVars, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshf-editor-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshf-title", children: t ? t("view.label") : "\u6587\u4EF6" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshf-spacer" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ThemeButton, {})
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshf-empty", children: t ? t("view.empty") : "\u5728\u5DE6\u4FA7\u6587\u4EF6\u6811\u4E2D\u9009\u62E9\u4E00\u4E2A\u6587\u4EF6\uFF0C\u5373\u53EF\u5728\u6B64\u7F16\u8F91" })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshf-editor-view", style: themeVars, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshf-editor-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: cx3("dshf-tabname", active.dirty && "dshf-dirty"), title: active.path, children: [
        active.dirty ? "\u25CF " : "",
        active.path.split("/").pop()
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshf-spacer" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshf-editor-path", title: active.path, children: active.path }),
      isMarkdownPath(active.path) && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          type: "button",
          className: "dshf-btn dshf-md-toggle",
          title: mdMode === "preview" ? "\u7F16\u8F91\u6E90\u7801" : "\u9884\u89C8\u6E32\u67D3\u6548\u679C",
          onClick: () => setMdMode(mdMode === "preview" ? "source" : "preview"),
          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MdModeIcon, { mode: mdMode })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ThemeButton, {}),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          type: "button",
          className: "dshf-btn",
          title: "\u4FDD\u5B58 (Ctrl+S)",
          disabled: !active.dirty || busy,
          onClick: () => void saveActive(),
          children: "\u4FDD\u5B58"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          type: "button",
          className: "dshf-btn",
          title: "\u5173\u95ED\u5F53\u524D\u6587\u4EF6",
          disabled: tabs2.length <= 1,
          onClick: closeEditor,
          children: "\u2715"
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: cx3("dshf-status", "dshf-status-top"), children: [
      tabs2.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshf-tabs-strip", children: tabs2.map((t2) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "span",
        {
          className: cx3("dshf-tab-chip", t2.path === activePath2 && "dshf-tab-chip-active"),
          title: t2.path,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                type: "button",
                className: "dshf-tab-chip-name",
                onClick: () => focusTab(t2.path),
                children: t2.path.split("/").pop()
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                type: "button",
                className: "dshf-tab-chip-close",
                "aria-label": `\u5173\u95ED ${t2.path.split("/").pop()}`,
                title: "\u5173\u95ED",
                onClick: () => closeTab(t2.path),
                children: "\u2715"
              }
            )
          ]
        },
        t2.path
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dshf-status-meta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshf-status-busy", children: busy ? "\u2026" : "" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: cx3("dshf-status-notice", notice === null && "dshf-hidden"), children: notice ?? "" })
      ] })
    ] }),
    isMarkdownPath(active.path) && mdMode === "preview" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MarkdownPreview, { content: active.content, path: active.path, remote }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      EditorPane,
      {
        path: active.path,
        content: active.content,
        onChange: updateActiveContent,
        theme
      },
      active.path
    )
  ] });
}
function ThemeButton() {
  const [open, setOpen] = (0, import_react6.useState)(false);
  const [importError, setImportError] = (0, import_react6.useState)(null);
  const fileRef = (0, import_react6.useRef)(null);
  const theme = useEditorTheme();
  const presetId = presetIdOf(theme);
  const handleExport = () => {
    const name = presetId !== void 0 ? `dsh-file \xB7 ${EDITOR_THEME_PRESET_LABELS[presetId] ?? presetId}` : "dsh-file \xB7 \u81EA\u5B9A\u4E49";
    const text = exportThemeText(theme, name);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dsh-file-theme-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseImportedTheme(String(reader.result ?? ""));
        setEditorTheme({ background: imported.background, foreground: imported.foreground, fontSize: imported.fontSize });
        setImportError(null);
      } catch (error) {
        setImportError(error instanceof Error ? error.message : String(error));
      }
    };
    reader.onerror = () => setImportError("\u8BFB\u53D6\u6587\u4EF6\u5931\u8D25");
    reader.readAsText(file);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dshf-theme-wrap", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "button",
      {
        type: "button",
        className: "dshf-btn",
        title: "\u7F16\u8F91\u5668\u4E3B\u9898\u8BBE\u7F6E",
        onClick: () => setOpen((v2) => !v2),
        children: "\u4E3B\u9898"
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshf-theme-panel", role: "dialog", "aria-label": "\u7F16\u8F91\u5668\u4E3B\u9898", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshf-theme-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshf-theme-label", children: "\u9884\u8BBE" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "select",
          {
            className: "dshf-theme-select",
            value: presetId ?? "custom",
            onChange: (e) => {
              const preset = EDITOR_THEME_PRESETS[e.target.value];
              if (preset) setEditorTheme(preset);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "custom", disabled: true, children: "\u81EA\u5B9A\u4E49" }),
              EDITOR_THEME_PRESET_ORDER.map((id) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: id, children: EDITOR_THEME_PRESET_LABELS[id] ?? id }, id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshf-theme-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshf-theme-label", children: "\u80CC\u666F" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            type: "color",
            value: theme.background,
            onChange: (e) => setEditorTheme({ background: e.target.value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { className: "dshf-theme-hex", children: theme.background })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshf-theme-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshf-theme-label", children: "\u6587\u5B57" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            type: "color",
            value: theme.foreground,
            onChange: (e) => setEditorTheme({ foreground: e.target.value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { className: "dshf-theme-hex", children: theme.foreground })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshf-theme-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshf-theme-label", children: "\u5B57\u53F7" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            type: "number",
            className: "dshf-theme-fontsize",
            min: 10,
            max: 28,
            value: theme.fontSize,
            onChange: (e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n > 0) setEditorTheme({ fontSize: n });
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshf-theme-unit", children: "px" })
      ] }),
      importError !== null && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshf-theme-error", children: importError }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshf-theme-row dshf-theme-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dshf-btn", title: "\u5C06\u5F53\u524D\u4E3B\u9898\u4FDD\u5B58\u4E3A JSON \u6587\u4EF6", onClick: handleExport, children: "\u5BFC\u51FA\u4E3B\u9898" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dshf-btn", title: "\u4ECE JSON \u6587\u4EF6\u5BFC\u5165\u4E3B\u9898", onClick: () => fileRef.current?.click(), children: "\u5BFC\u5165\u4E3B\u9898" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            ref: fileRef,
            type: "file",
            accept: ".json,application/json",
            className: "dshf-hidden-input",
            onChange: handleImportFile
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dshf-btn", title: "\u6062\u590D\u9ED8\u8BA4\u6D45\u8272\u4E3B\u9898", onClick: () => resetEditorTheme(), children: "\u91CD\u7F6E" })
      ] })
    ] })
  ] });
}
function EditorPane({ path, content, onChange, theme }) {
  const [mode, setMode] = (0, import_react6.useState)("loading");
  const [monacoLib, setMonacoLib] = (0, import_react6.useState)(null);
  const hostRef = (0, import_react6.useRef)(null);
  const editorRef = (0, import_react6.useRef)(null);
  const onChangeRef = (0, import_react6.useRef)(onChange);
  onChangeRef.current = onChange;
  const initialRef = (0, import_react6.useRef)(content);
  initialRef.current = content;
  (0, import_react6.useEffect)(() => {
    let disposed = false;
    setMode("loading");
    ensureMonaco().then((monaco) => {
      if (disposed) return;
      setMonacoLib(monaco);
      setMode("monaco");
    }).catch(() => {
      if (!disposed) setMode("highlight");
    });
    return () => {
      disposed = true;
      setMonacoLib(null);
    };
  }, [path]);
  (0, import_react6.useEffect)(() => {
    if (mode !== "monaco" || monacoLib === null || hostRef.current === null) return;
    const initial = initialRef.current;
    const monacoAny = monacoLib;
    const editor = monacoAny.editor.create(hostRef.current, {
      value: initial,
      language: languageOf(path),
      automaticLayout: true,
      fontSize: theme.fontSize,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      tabSize: 2
    });
    editor.onDidChangeModelContent(() => onChangeRef.current(editor.getValue()));
    editorRef.current = editor;
    return () => {
      editor.dispose();
      editorRef.current = null;
    };
  }, [mode, monacoLib, path]);
  (0, import_react6.useEffect)(() => {
    if (mode !== "monaco" || monacoLib === null) return;
    const monacoAny = monacoLib;
    try {
      const light = isLightColor(theme.background);
      monacoAny.editor.defineTheme("dshf-editor", {
        base: light ? "vs" : "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": theme.background,
          "editor.foreground": theme.foreground,
          "editorLineNumber.foreground": mixColors(theme.foreground, theme.background, 0.45),
          "editorLineNumber.activeForeground": theme.foreground,
          "editorCursor.foreground": theme.foreground,
          "editor.selectionBackground": light ? "#add6ff" : "#264f78",
          "editor.inactiveSelectionBackground": light ? "#e5ebf1" : "#3a3d41",
          "editor.lineHighlightBackground": light ? "#e3edf7" : "#282a2d",
          "editorWidget.background": mixColors(theme.background, light ? "#000000" : "#ffffff", 0.08),
          "editorWidget.border": mixColors(theme.background, light ? "#000000" : "#ffffff", 0.2),
          "scrollbarSlider.background": mixColors(theme.foreground, theme.background, 0.2),
          "scrollbarSlider.hoverBackground": mixColors(theme.foreground, theme.background, 0.3)
        }
      });
      monacoAny.editor.setTheme("dshf-editor");
    } catch {
    }
    editorRef.current?.updateOptions?.({ fontSize: theme.fontSize });
  }, [mode, monacoLib, theme.background, theme.foreground, theme.fontSize]);
  if (mode === "loading") {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshf-empty", children: "\u7F16\u8F91\u5668\u52A0\u8F7D\u4E2D\u2026" });
  }
  if (mode === "monaco") {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { ref: hostRef, className: "dshf-monaco" });
  }
  if (mode === "highlight") {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("pre", { className: "dshf-highlight-fallback", dangerouslySetInnerHTML: { __html: highlightFallback(path, content) } });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "textarea",
    {
      className: "dshf-textarea",
      value: content,
      onChange: (e) => onChange(e.target.value),
      spellCheck: false
    }
  );
}
function MarkdownPreview({ content, path, remote }) {
  const html = (0, import_react6.useMemo)(() => renderMarkdown(content), [content]);
  const rootRef = (0, import_react6.useRef)(null);
  const remoteRef = (0, import_react6.useRef)(remote);
  remoteRef.current = remote;
  (0, import_react6.useEffect)(() => {
    const root = rootRef.current;
    if (root === null) return;
    const dir = path.slice(0, path.lastIndexOf("/") + 1);
    const imgs = root.querySelectorAll("img[src]");
    let cancelled = false;
    for (const img of imgs) {
      const src = img.getAttribute("src") ?? "";
      if (/^(?:https?:|data:|blob:)/i.test(src)) continue;
      if (src.startsWith("#")) continue;
      const target = src.startsWith("/") ? src.slice(1) : `${dir}${src}`;
      void remoteRef.current.readDataUrl(target).then((result) => unwrap(result)).then(({ dataUrl }) => {
        if (cancelled) return;
        img.setAttribute("src", dataUrl);
      }).catch(() => {
      });
    }
    return () => {
      cancelled = true;
    };
  }, [html, path]);
  const onPreviewClick = (0, import_react6.useCallback)((e) => {
    const anchor = e.target.closest("a");
    if (anchor === null) return;
    const href = anchor.getAttribute("href") ?? "";
    e.preventDefault();
    if (/^https?:\/\//i.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "div",
    {
      ref: rootRef,
      className: "dshf-md-preview",
      onClick: onPreviewClick,
      dangerouslySetInnerHTML: { __html: html }
    }
  );
}
function MdModeIcon({ mode }) {
  if (mode === "preview") {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M4 2h8v1H4zM2 4h12v1H2zM4 6h8v1H4zM2 8h12v1H2zM4 10h4v1H4z", fill: "currentColor" }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M11.3 1.3l3.4 3.4-7.9 7.9L3 13l.4-3.8 7.9-7.9z", fill: "currentColor" }) });
}
function languageOf(path) {
  const filename = path.split(/[\\/]/).pop()?.toLowerCase() ?? "";
  if (filename === "cmakelists.txt" || filename.endsWith(".cmake")) return "shell";
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "ts":
    case "tsx":
    case "mts":
    case "cts":
      return "typescript";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "json":
      return "json";
    case "md":
    case "markdown":
      return "markdown";
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "scss":
      return "scss";
    case "less":
      return "less";
    case "py":
      return "python";
    case "rb":
      return "ruby";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "java":
      return "java";
    case "c":
    case "h":
      return "c";
    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
    case "hh":
    case "hxx":
    case "inl":
    case "ipp":
    case "tpp":
      return "cpp";
    case "cs":
      return "csharp";
    case "sh":
    case "bash":
      return "shell";
    case "yml":
    case "yaml":
      return "yaml";
    case "xml":
    case "svg":
      return "xml";
    case "sql":
      return "sql";
    case "php":
      return "php";
    case "vue":
      return "html";
    case "svelte":
      return "html";
    default:
      return "plaintext";
  }
}

// src/client/styles.css
var styles_default = `/* dsh-file plugin styles. Kept dependency-free: plain CSS with DSH design\r
 * tokens where available, sensible fallbacks elsewhere. */\r
\r
/* \u2500\u2500 sidebar tree panel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.dshf-root {\r
  display: flex;\r
  flex-direction: column;\r
  height: 100%;\r
  min-height: 0;\r
  box-sizing: border-box;\r
  font-size: 13px;\r
  color: var(--dsw-alias-label-primary, #1f2328);\r
}\r
\r
.dshf-toolbar {\r
  display: flex;\r
  align-items: center;\r
  gap: 6px;\r
  padding: 6px 8px;\r
  border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));\r
  flex: none;\r
}\r
\r
.dshf-title {\r
  font-weight: 600;\r
  white-space: nowrap;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  max-width: 120px;\r
}\r
\r
.dshf-spacer {\r
  flex: 1;\r
}\r
\r
.dshf-btn {\r
  background: transparent;\r
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.15));\r
  border-radius: 6px;\r
  color: inherit;\r
  cursor: pointer;\r
  font-size: 12px;\r
  padding: 2px 6px;\r
  line-height: 1.5;\r
}\r
.dshf-btn:hover {\r
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));\r
}\r
.dshf-btn:disabled {\r
  opacity: 0.5;\r
  cursor: default;\r
}\r
\r
/* \u7EAF\u56FE\u6807\u6309\u94AE\uFF08\u5DE5\u5177\u6761\uFF09\uFF1ADSH \u98CE\u683C\u7684\u65E0\u8FB9\u6846 ghost \u56FE\u6807\u6309\u94AE */\r
.dshf-btn-icon {\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  border-color: transparent;\r
  padding: 4px;\r
  border-radius: 6px;\r
}\r
\r
/* \u9875\u9762\u5185\u786E\u8BA4\u5F39\u5C42\uFF08\u66FF\u4EE3 window.confirm\uFF0C\u684C\u9762\u7AEF Electron \u4E0D\u652F\u6301\u539F\u751F\u5F39\u6846\uFF09 */\r
.dshf-modal-overlay {\r
  position: fixed;\r
  inset: 0;\r
  z-index: 1000;\r
  background: rgba(0, 0, 0, 0.35);\r
  display: flex;\r
  align-items: center;\r
  justify-content: center;\r
}\r
.dshf-modal {\r
  min-width: 260px;\r
  max-width: 360px;\r
  background: var(--dsw-alias-bg-primary, #ffffff);\r
  color: var(--dsw-alias-label-primary, #1f2328);\r
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.15));\r
  border-radius: 10px;\r
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);\r
  padding: 14px 16px;\r
}\r
.dshf-modal-title {\r
  font-size: 14px;\r
  font-weight: 600;\r
  margin-bottom: 6px;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
.dshf-modal-body {\r
  font-size: 13px;\r
  color: var(--dsw-alias-label-secondary, #495057);\r
  margin-bottom: 14px;\r
  word-break: break-all;\r
}\r
.dshf-modal-actions {\r
  display: flex;\r
  justify-content: flex-end;\r
  gap: 8px;\r
}\r
.dshf-btn-danger {\r
  background: var(--dsw-alias-danger-fg, #c92a2a);\r
  border-color: transparent;\r
  color: #ffffff;\r
}\r
.dshf-btn-danger:hover {\r
  background: var(--dsw-alias-danger-fg, #c92a2a);\r
  filter: brightness(1.1);\r
}\r
\r
.dshf-error {\r
  padding: 8px 12px;\r
  color: var(--dsw-alias-danger-fg, #c92a2a);\r
  font-size: 12px;\r
}\r
\r
.dshf-tree-pane {\r
  flex: 1;\r
  min-height: 0;\r
  display: flex;\r
  overflow: hidden;\r
}\r
\r
.dshf-tree-scroll {\r
  overflow: auto;\r
  flex: 1;\r
  min-height: 0;\r
  padding: 4px 0;\r
}\r
\r
.dshf-tree-list {\r
  min-width: max-content;\r
}\r
\r
.dshf-tree-hint {\r
  padding: 4px 12px;\r
  color: var(--dsw-alias-label-tertiary, #868e96);\r
  font-size: 12px;\r
}\r
\r
.dshf-node {\r
  display: flex;\r
  align-items: center;\r
  gap: 4px;\r
  padding: 2px 8px;\r
  cursor: pointer;\r
  white-space: nowrap;\r
  user-select: none;\r
  min-height: 22px;\r
}\r
.dshf-node:hover {\r
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));\r
}\r
.dshf-selected {\r
  background: var(--dsw-alias-interactive-bg-selected, rgba(77, 171, 247, 0.15));\r
}\r
\r
.dshf-caret {\r
  width: 12px;\r
  flex: none;\r
  font-size: 10px;\r
  color: var(--dsw-alias-label-tertiary, #868e96);\r
}\r
\r
.dshf-icon {\r
  flex: none;\r
  font-size: 13px;\r
}\r
\r
.dshf-name {\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  min-width: 0;\r
}\r
\r
/* VS Code \u5F0F\u5185\u8054\u8F93\u5165\u884C\uFF08\u65B0\u5EFA/\u91CD\u547D\u540D\uFF09\uFF1Aaccent \u8FB9\u6846\u7684\u8F93\u5165\u6846 */\r
.dshf-node-editing {\r
  cursor: default;\r
}\r
.dshf-inline-input {\r
  flex: 1;\r
  min-width: 0;\r
  font: inherit;\r
  font-size: 13px;\r
  line-height: 1.4;\r
  color: inherit;\r
  background: var(--dsw-alias-bg-primary, #ffffff);\r
  border: 1px solid var(--dsw-alias-accent-strong, #4dabf7);\r
  border-radius: 4px;\r
  padding: 1px 4px;\r
  outline: none;\r
}\r
\r
.dshf-node-actions {\r
  display: none;\r
  margin-left: auto;\r
  gap: 2px;\r
  flex: none;\r
}\r
.dshf-node:hover .dshf-node-actions {\r
  display: inline-flex;\r
}\r
\r
.dshf-mini {\r
  background: transparent;\r
  border: none;\r
  cursor: pointer;\r
  font-size: 11px;\r
  padding: 0 2px;\r
  opacity: 0.7;\r
}\r
.dshf-mini:hover {\r
  opacity: 1;\r
}\r
\r
.dshf-status {\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
  padding: 4px 8px;\r
  border-top: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));\r
  flex: none;\r
  font-size: 11px;\r
  color: var(--dsw-alias-label-tertiary, #868e96);\r
  min-height: 22px;\r
}\r
\r
/* Status row placed at the TOP of the editor view (below the toolbar):\r
 * the open-file tab strip reads top-down, so the border flips sides. */\r
.dshf-status-top {\r
  border-top: none;\r
  border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));\r
}\r
\r
.dshf-status-busy {\r
  color: var(--dsw-alias-accent-strong, #4dabf7);\r
}\r
\r
.dshf-status-notice {\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
\r
.dshf-status-hint {\r
  margin-left: auto;\r
  white-space: nowrap;\r
  color: var(--dsw-alias-label-tertiary, #868e96);\r
}\r
\r
.dshf-hidden {\r
  display: none;\r
}\r
\r
/* \u2500\u2500 center-column editor view (conversation.view) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
/* Renders IN the conversation center column's view area (inside the session\r
 * scroll body), alongside chat / trajectory \u2014 never a popup. Fills the view\r
 * area the session body reserves for the active view.\r
 *\r
 * The whole view is ONE cohesive surface. Colors come from the editor theme\r
 * (themeStore) via CSS custom properties with LIGHT defaults (the default\r
 * theme is light), so the chrome always matches the Monaco background\r
 * instead of clashing with the page. */\r
.dshf-editor-view {\r
  display: flex;\r
  flex-direction: column;\r
  height: 100%;\r
  min-height: 0;\r
  box-sizing: border-box;\r
  position: relative;\r
  background: var(--dshf-bg, #ffffff);\r
  color: var(--dshf-fg, #1f2328);\r
  font-size: 13px;\r
}\r
\r
.dshf-editor-view .dshf-editor-toolbar {\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
  padding: 6px 10px;\r
  background: var(--dshf-chrome, #f3f3f3);\r
  border-bottom: 1px solid var(--dshf-border, #e0e0e0);\r
  flex: none;\r
  font-size: 12px;\r
  color: var(--dshf-fg, #1f2328);\r
}\r
\r
.dshf-editor-view .dshf-tabname {\r
  font-weight: 600;\r
  white-space: nowrap;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  color: var(--dshf-fg, #1f2328);\r
}\r
.dshf-editor-view .dshf-dirty {\r
  color: var(--dshf-dirty, #c2410c);\r
}\r
\r
.dshf-editor-view .dshf-editor-path {\r
  min-width: 0;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
  color: var(--dshf-muted, #868e96);\r
  font-size: 11px;\r
}\r
\r
.dshf-editor-view .dshf-status-top {\r
  background: var(--dshf-chrome, #f3f3f3);\r
  color: var(--dshf-muted, #868e96);\r
}\r
\r
.dshf-editor-view .dshf-empty {\r
  color: var(--dshf-muted, #868e96);\r
}\r
\r
.dshf-editor-view .dshf-monaco {\r
  flex: 1;\r
  min-height: 0;\r
}\r
\r
.dshf-editor-view .dshf-textarea {
  flex: 1;\r
  min-height: 0;\r
  resize: none;\r
  border: none;\r
  outline: none;\r
  padding: 8px 12px;\r
  font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);\r
  font-size: var(--dshf-font-size, 13px);\r
  line-height: 1.5;\r
  background: var(--dshf-bg, #ffffff);\r
  color: var(--dshf-fg, #1f2328);
}

.dshf-editor-view .dshf-highlight-fallback {
  flex: 1;
  min-height: 0;
  margin: 0;
  overflow: auto;
  padding: 8px 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: var(--dshf-font-size, 13px);
  line-height: 1.5;
  background: var(--dshf-bg, #ffffff);
  color: var(--dshf-fg, #1f2328);
}

.dshf-editor-view .dshf-highlight-fallback .hljs-keyword,
.dshf-editor-view .dshf-highlight-fallback .hljs-built_in,
.dshf-editor-view .dshf-highlight-fallback .hljs-type,
.dshf-editor-view .dshf-highlight-fallback .hljs-title {
  color: #a626a4;
}

.dshf-editor-view .dshf-highlight-fallback .hljs-string,
.dshf-editor-view .dshf-highlight-fallback .hljs-meta {
  color: #50a14f;
}

.dshf-editor-view .dshf-highlight-fallback .hljs-number,
.dshf-editor-view .dshf-highlight-fallback .hljs-literal {
  color: #986801;
}

.dshf-editor-view .dshf-highlight-fallback .hljs-comment {
  color: #708090;
  font-style: italic;
}
\r
.dshf-editor-view .dshf-btn {\r
  color: var(--dshf-fg, #1f2328);\r
  border-color: var(--dshf-border, #d0d0d0);\r
}\r
.dshf-editor-view .dshf-btn:hover {\r
  background: var(--dshf-chip, #ececec);\r
}\r
\r
.dshf-editor-view .dshf-tab-chip {\r
  background: var(--dshf-chip, #ececec);\r
  border-color: var(--dshf-border, #d0d0d0);\r
  color: var(--dshf-fg, #1f2328);\r
}\r
.dshf-editor-view .dshf-tab-chip:hover {\r
  background: var(--dshf-border, #c9c9c9);\r
}\r
.dshf-editor-view .dshf-tab-chip-active {\r
  background: var(--dshf-accent, #094771);\r
  border-color: var(--dshf-accent, #094771);\r
  color: #ffffff;\r
}\r
.dshf-editor-view .dshf-tab-chip-close:hover {\r
  background: var(--dshf-border, rgba(0, 0, 0, 0.1));\r
}\r
\r
/* \u2500\u2500 Markdown preview (read-only rendered view) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.dshf-editor-view .dshf-md-preview {\r
  flex: 1;\r
  min-height: 0;\r
  overflow: auto;\r
  padding: 12px 20px 32px;\r
  font-size: var(--dshf-font-size, 13px);\r
  line-height: 1.6;\r
  color: var(--dshf-fg, #1f2328);\r
  background: var(--dshf-bg, #ffffff);\r
  box-sizing: border-box;\r
  word-wrap: break-word;\r
}\r
\r
.dshf-editor-view .dshf-md-preview > :first-child {\r
  margin-top: 0;\r
}\r
\r
.dshf-editor-view .dshf-md-preview h1,\r
.dshf-editor-view .dshf-md-preview h2,\r
.dshf-editor-view .dshf-md-preview h3,\r
.dshf-editor-view .dshf-md-preview h4 {\r
  margin: 1.2em 0 0.5em;\r
  line-height: 1.3;\r
  color: var(--dshf-fg, #1f2328);\r
}\r
.dshf-editor-view .dshf-md-preview h1 { font-size: 1.6em; border-bottom: 1px solid var(--dshf-border, #e0e0e0); padding-bottom: 0.3em; }\r
.dshf-editor-view .dshf-md-preview h2 { font-size: 1.35em; border-bottom: 1px solid var(--dshf-border, #e0e0e0); padding-bottom: 0.25em; }\r
.dshf-editor-view .dshf-md-preview h3 { font-size: 1.15em; }\r
.dshf-editor-view .dshf-md-preview h4 { font-size: 1em; }\r
\r
.dshf-editor-view .dshf-md-preview p {\r
  margin: 0.6em 0;\r
}\r
\r
.dshf-editor-view .dshf-md-preview ul,\r
.dshf-editor-view .dshf-md-preview ol {\r
  margin: 0.6em 0;\r
  padding-left: 1.6em;\r
}\r
\r
.dshf-editor-view .dshf-md-preview li {\r
  margin: 0.2em 0;\r
}\r
\r
.dshf-editor-view .dshf-md-preview blockquote {\r
  margin: 0.8em 0;\r
  padding: 0.1em 1em;\r
  border-left: 3px solid var(--dshf-border, #d0d0d0);\r
  color: var(--dshf-muted, #868e96);\r
  background: var(--dshf-chip, #f3f3f3);\r
  border-radius: 0 6px 6px 0;\r
}\r
\r
.dshf-editor-view .dshf-md-preview code {\r
  font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);\r
  font-size: 0.92em;\r
  background: var(--dshf-chip, #ececec);\r
  border-radius: 4px;\r
  padding: 0.1em 0.35em;\r
}\r
\r
.dshf-editor-view .dshf-md-preview pre {\r
  margin: 0.8em 0;\r
  padding: 10px 12px;\r
  background: var(--dshf-chip, #ececec);\r
  border: 1px solid var(--dshf-border, #d0d0d0);\r
  border-radius: 8px;\r
  overflow: auto;\r
}\r
.dshf-editor-view .dshf-md-preview pre code {\r
  background: transparent;\r
  padding: 0;\r
  font-size: 0.92em;\r
  line-height: 1.5;\r
}\r
\r
.dshf-editor-view .dshf-md-preview a {\r
  color: var(--dshf-accent, #094771);\r
  text-decoration: none;\r
}\r
.dshf-editor-view .dshf-md-preview a:hover {\r
  text-decoration: underline;\r
}\r
\r
.dshf-editor-view .dshf-md-preview img {\r
  max-width: 100%;\r
}\r
\r
.dshf-editor-view .dshf-md-preview table {\r
  border-collapse: collapse;\r
  margin: 0.8em 0;\r
  display: block;\r
  overflow: auto;\r
  max-width: 100%;\r
}\r
.dshf-editor-view .dshf-md-preview th,\r
.dshf-editor-view .dshf-md-preview td {\r
  border: 1px solid var(--dshf-border, #d0d0d0);\r
  padding: 4px 10px;\r
}\r
.dshf-editor-view .dshf-md-preview th {\r
  background: var(--dshf-chip, #ececec);\r
  font-weight: 600;\r
}\r
\r
.dshf-editor-view .dshf-md-preview hr {\r
  border: none;\r
  border-top: 1px solid var(--dshf-border, #d0d0d0);\r
  margin: 1em 0;\r
}\r
\r
.dshf-editor-view .dshf-md-preview input[type='checkbox'] {\r
  margin-right: 0.4em;\r
}\r
\r
/* Toggle button: keep it subtle like the theme button */\r
.dshf-editor-view .dshf-md-toggle {\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  padding: 2px 5px;\r
}\r
.dshf-editor-view .dshf-md-toggle svg {\r
  display: block;\r
}\r
\r
/* \u2500\u2500 editor theme panel (VS Code style) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.dshf-theme-wrap {\r
  position: relative;\r
  display: inline-flex;\r
}\r
\r
.dshf-theme-panel {\r
  position: absolute;\r
  top: calc(100% + 4px);\r
  right: 0;\r
  z-index: 40;\r
  width: 252px;\r
  display: flex;\r
  flex-direction: column;\r
  gap: 8px;\r
  box-sizing: border-box;\r
  padding: 10px;\r
  background: var(--dshf-chrome, #f3f3f3);\r
  border: 1px solid var(--dshf-border, #d0d0d0);\r
  border-radius: 8px;\r
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);\r
  color: var(--dshf-fg, #1f2328);\r
  font-size: 12px;\r
}\r
\r
.dshf-theme-row {\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
  min-width: 0;\r
}\r
\r
.dshf-theme-label {\r
  flex: none;\r
  width: 44px;\r
  color: var(--dshf-muted, #868e96);\r
}\r
\r
.dshf-theme-select {\r
  flex: 1;\r
  min-width: 0;\r
  background: var(--dshf-chip, #ececec);\r
  border: 1px solid var(--dshf-border, #d0d0d0);\r
  border-radius: 6px;\r
  color: var(--dshf-fg, #1f2328);\r
  font-size: 12px;\r
  padding: 2px 6px;\r
  cursor: pointer;\r
}\r
.dshf-theme-select:focus {\r
  outline: none;\r
  border-color: var(--dshf-accent, #094771);\r
}\r
\r
.dshf-theme-row input[type='color'] {\r
  width: 34px;\r
  height: 22px;\r
  padding: 0;\r
  border: 1px solid var(--dshf-border, #d0d0d0);\r
  border-radius: 4px;\r
  background: var(--dshf-chip, #ececec);\r
  cursor: pointer;\r
}\r
\r
.dshf-theme-hex {\r
  font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);\r
  font-size: 11px;\r
  color: var(--dshf-muted, #868e96);\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
}\r
\r
.dshf-theme-error {\r
  color: var(--dshf-dirty, #c2410c);\r
  font-size: 11px;\r
  line-height: 1.4;\r
}\r
\r
.dshf-hidden-input {\r
  display: none;\r
}\r
\r
.dshf-theme-fontsize {\r
  width: 52px;\r
  background: var(--dshf-chip, #ececec);\r
  border: 1px solid var(--dshf-border, #d0d0d0);\r
  border-radius: 4px;\r
  color: var(--dshf-fg, #1f2328);\r
  font-size: 12px;\r
  padding: 1px 4px;\r
}\r
\r
.dshf-theme-unit {\r
  color: var(--dshf-muted, #868e96);\r
  font-size: 11px;\r
}\r
\r
.dshf-theme-actions {\r
  justify-content: flex-end;\r
  border-top: 1px solid var(--dshf-border, rgba(0, 0, 0, 0.1));\r
  padding-top: 8px;\r
}\r
\r
.dshf-empty {\r
  display: flex;\r
  align-items: center;\r
  justify-content: center;\r
  flex: 1;\r
  color: var(--dsw-alias-label-tertiary, #868e96);\r
  font-size: 12px;\r
}\r
\r
.dshf-tabs-strip {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 4px;\r
  overflow: hidden;\r
  max-width: 60%;\r
}\r
\r
/* One open-file tab: a chip container holding the (clickable) name and a\r
 * per-file close "\u2715". Left-aligned in the status row. */\r
.dshf-tab-chip {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 2px;\r
  background: transparent;\r
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));\r
  border-radius: 6px;\r
  color: var(--dsw-alias-label-secondary, #495057);\r
  font-size: 11px;\r
  padding: 1px 2px 1px 6px;\r
  white-space: nowrap;\r
  max-width: 160px;\r
}\r
.dshf-tab-chip:hover {\r
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));\r
}\r
.dshf-tab-chip-active {\r
  background: var(--dsw-alias-interactive-bg-selected, rgba(77, 171, 247, 0.15));\r
  border-color: var(--dsw-alias-accent-strong, #4dabf7);\r
}\r
\r
/* Filename part of a tab (click to focus). */\r
.dshf-tab-chip-name {\r
  background: transparent;\r
  border: none;\r
  padding: 0;\r
  margin: 0;\r
  font: inherit;\r
  color: inherit;\r
  cursor: pointer;\r
  white-space: nowrap;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  min-width: 0;\r
}\r
.dshf-tab-chip-name:hover {\r
  text-decoration: underline;\r
}\r
\r
/* Per-file close button. */\r
.dshf-tab-chip-close {\r
  background: transparent;\r
  border: none;\r
  padding: 0 3px;\r
  margin: 0;\r
  font-size: 10px;\r
  line-height: 1;\r
  color: inherit;\r
  cursor: pointer;\r
  opacity: 0.55;\r
  border-radius: 4px;\r
  flex: none;\r
}\r
.dshf-tab-chip-close:hover {\r
  opacity: 1;\r
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.08));\r
}\r
\r
/* Busy / notice group pushed to the right end of the status row. */\r
.dshf-status-meta {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 8px;\r
  margin-left: auto;\r
  min-width: 0;\r
}\r
\r
/* Sidebar footer toggle button */\r
.dshf-toggle {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 6px;\r
  background: transparent;\r
  border: 1px solid transparent;\r
  border-radius: 8px;\r
  color: var(--dsw-alias-label-secondary, #495057);\r
  cursor: pointer;\r
  padding: 6px 10px;\r
  flex: 1;\r
  min-width: 0;\r
}\r
.dshf-toggle:hover {\r
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));\r
}\r
\r
.dshf-toggle-label {\r
  font-size: 13px;\r
  white-space: nowrap;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
}\r
`;

// src/client/index.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var CSS_TAG = "dsh-file/styles.css";
if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${CSS_TAG}"]`) === null) {
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-file";
  tag.dataset.pluginCss = CSS_TAG;
  tag.textContent = styles_default;
  document.head.appendChild(tag);
}
var NS = "dshFile";
var zh = {
  "toggle.label": "\u6587\u4EF6",
  "toggle.open": "\u6253\u5F00\u6587\u4EF6\u7BA1\u7406\u5668",
  "toggle.close": "\u5173\u95ED\u6587\u4EF6\u7BA1\u7406\u5668",
  "view.label": "\u6587\u4EF6",
  "view.empty": "\u5728\u5DE6\u4FA7\u6587\u4EF6\u6811\u4E2D\u9009\u62E9\u4E00\u4E2A\u6587\u4EF6\uFF0C\u5373\u53EF\u5728\u6B64\u7F16\u8F91"
};
var en = {
  "toggle.label": "Files",
  "toggle.open": "Open file manager",
  "toggle.close": "Close file manager",
  "view.label": "Files",
  "view.empty": "Select a file in the sidebar tree to edit it here"
};
var inject = ["slots", "locale", "remote"];
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-file: dictionaries");
  const t = ctx.locale.bind(NS);
  const mountRemote = ctx.effect(async () => {
    const dispose = await ctx.remote.$mount(TYPERT_REMOTE);
    return () => dispose();
  }, "dsh-file: remote mount");
  let disposePanel = null;
  let open = false;
  const closePanel = () => {
    if (disposePanel === null) return;
    disposePanel();
    disposePanel = null;
    open = false;
    ctx.logger?.info?.("[dsh-file] file manager closed");
  };
  const openPanel = () => {
    if (disposePanel !== null) return;
    const remote = ctx.get("remote.fileManager");
    const face = {
      remote,
      onClose: closePanel
    };
    disposePanel = ctx.slots.register({
      name: "sidebar.workspaces",
      priority: -1,
      registrant: "dsh-file"
    }, (props) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FileManagerPanel, { ...face, useSessions: props.useSessions, onFileOpened: activateEditorView }));
    open = true;
    ctx.logger?.info?.("[dsh-file] file manager opened");
  };
  const togglePanel = () => open ? closePanel() : openPanel();
  const syncSidebarWithView = () => {
    if (isEditorViewActive()) openPanel();
    else closePanel();
  };
  ctx.effect(() => subscribeEditorViewActive(syncSidebarWithView), "dsh-file: view\u2194sidebar sync");
  ctx.slots.inject("conversation.view", () => ctx.slots.register({
    name: "conversation.view",
    id: "dsh-file",
    order: 20,
    label: () => t("view.label"),
    locale: NS,
    registrant: "dsh-file"
  }, () => {
    const remote = ctx.get("remote.fileManager");
    if (remote === void 0) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FileEditorView, { remote });
  }));
  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
    name: "sidebar.footer.action",
    id: "dsh-file-toggle",
    locale: NS,
    inject: () => ({
      onToggle: togglePanel,
      isOpen: () => open
    })
  }, FileToggleButton));
  const activateEditorView = () => {
    const label = t("view.label");
    for (const tab of Array.from(document.querySelectorAll('[role="tab"]'))) {
      if (tab.textContent?.trim() === label) {
        tab.click();
        return;
      }
    }
  };
  ctx.effect(() => () => {
    closePanel();
  }, "dsh-file: panel cleanup");
  void mountRemote;
}
function FileToggleButton(props) {
  const { wide, t, onToggle, isOpen } = props;
  const label = t ? t("toggle.label") : "\u6587\u4EF6";
  const title = t ? isOpen() ? t("toggle.close") : t("toggle.open") : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "button",
    {
      type: "button",
      className: "dshf-toggle",
      title,
      "aria-label": label,
      onClick: onToggle,
      style: isOpen() ? { fontWeight: 700 } : void 0,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FolderOpenIcon, { size: wide ? 14 : 16 }),
        wide ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshf-toggle-label", children: label }) : null
      ]
    }
  );
}
function FolderOpenIcon(props) {
  const size = props.size ?? 16;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", style: { display: "block" }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "path",
    {
      d: "M5.19629 1.57104C5.81144 1.5711 6.38623 1.8786 6.72754 2.39038L7.19922 3.09839C7.28454 3.22635 7.42824 3.30344 7.58203 3.30347H12.1699C13.5039 3.30348 14.5859 4.38548 14.5859 5.71948V6.62671C15.2694 7.02689 15.6605 7.85012 15.4385 8.68726L14.3848 12.658C14.1037 13.7164 13.1449 14.4527 12.0498 14.4529H2.91699C1.51651 14.4529 0.451662 13.2814 0.501954 11.9519V3.98706C0.501954 2.65305 1.58396 1.57104 2.91797 1.57104H5.19629ZM3.7793 7.75562C3.30994 7.75562 2.89883 8.07153 2.77832 8.52515L1.91602 11.7722C1.74167 12.4291 2.23734 13.073 2.91699 13.073H12.0498C12.5191 13.0728 12.9304 12.757 13.0508 12.3035L14.1045 8.33374C14.1819 8.04202 13.9619 7.756 13.6602 7.75562H3.7793ZM2.91797 2.9519C2.34625 2.9519 1.88281 3.41534 1.88281 3.98706V7.2937C2.33068 6.7269 3.02249 6.37476 3.7793 6.37476H13.2051V5.71948C13.2051 5.14777 12.7416 4.68434 12.1699 4.68433H7.58203C6.96675 4.6843 6.39209 4.37595 6.05078 3.86401L5.5791 3.15601C5.49379 3.02821 5.34995 2.95196 5.19629 2.9519H2.91797Z",
      fill: "currentColor"
    }
  ) });
}
return module.exports;
  }
});

