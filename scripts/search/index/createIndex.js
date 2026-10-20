const FlexSearch = require("flexsearch");
const fs = require('fs');
const path = require('path');
const {readdir} = require('fs').promises;
const contentTreeToJson = require('../../contentTreeToJson');
const {process} = require("../../contentTreeToJson");
const {parse: parseToml} = require('smol-toml');

const sitePath = path.resolve(__dirname + '/../../..');
const contentPath = path.resolve(sitePath + '/content');

// site params read from the site config file directly, `hugo config` omits zero values (e.g. latest_patch_release = 0)
const configFile = ['hugo.toml', 'config.toml']
    .map(name => path.resolve(sitePath, name))
    .find(file => fs.existsSync(file));
const siteParams = configFile ? (parseToml(fs.readFileSync(configFile).toString()).params || {}) : {};

// hugo params keys are case-insensitive
const getParam = (obj, key) => {
    if (obj === null || typeof obj !== 'object') return undefined;
    const matchedKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    return matchedKey === undefined ? undefined : obj[matchedKey];
};

// replace {{< params "key" >}} and {{% params "key" %}} shortcodes with their values from the site config
const resolveParamsShortcodes = (text, filename) => text.replace(
    /\{\{[<%]\s*params\s+"([^"]+)"\s*[>%]\}\}/g,
    (shortcode, key) => {
        const value = key.split('.').reduce(getParam, siteParams);
        if (value === undefined) {
            throw new Error(`params shortcode: key '${key}' does not exist in site config (${shortcode} in ${filename})`);
        }
        return String(value);
    }
);

(async () => {
    let index = new FlexSearch.Document({
        document: {
            id: 'number',
            index: ['content', 'headers', 'title']
        },
        charset: "latin",
        tokenize: "full",
        matcher: "simple",
        cache: true
    })


    let docIndex = 0;
    const buildIndex = function (jsonTree, breadCrumbs = []) {

        for (const item of jsonTree) {
            docIndex++;
            const content = resolveParamsShortcodes(fs.readFileSync(item.filename).toString(), item.filename);
            const headersMatches = content.matchAll(/^\s*#{1,6}\s*(.*?)$/gm);
            let copiedBC = [...breadCrumbs];
            copiedBC.push({title:  item.title, url:  item.url});

            let document = {
                number: docIndex,
                content: content
                    .replace(/(---|\+\+\+)[\S\s]*?(---|\+\+\+)/gm, " ") // remove frontmatter
                    .replace(/[^a-zA-Z0-9_\(\.\)\'\"\:]/g, ' ') // remove chars except alphanumeric, (, ), ., ', ", :
                    .replace(/\s\s+/g, ' ') // remove extra spaces
                    .replace(/\n/g, " ") // remove newlines
                    .replace('Suggest changes', ''),
                title: item.title,
                headers: item.title,
                headersMap: {'top': item.title}
            };

            if (headersMatches) {
                for (const match of headersMatches) {
                    const header = match[1]
                        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // inline links/images convert to text
                        .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1') // reference links convert to text
                        .trim();
                    const headerId = header
                        .replace(/\W+/g, '-')
                        .replace(/-$/, '')
                        .toLowerCase();
                    document.headers += ` ${header}`;
                    document.headersMap[headerId] = header;
                }
            }

            fs.writeFileSync(path.resolve(__dirname + `/documents/${docIndex}.json`), JSON.stringify({
                ...document,
                uri: item.url,
                breadCrumbs: copiedBC
            }));

            index.add(document);

            if (item.hasOwnProperty('children')) {
                buildIndex(item.children, copiedBC);
            }
        }
    }

    const jsonTree = contentTreeToJson.orderJsonTree(contentTreeToJson.process(contentPath, contentPath));
    buildIndex(jsonTree.children);

    index.export((key, data) => fs.writeFileSync(path.resolve(__dirname + `/searchIndex/${key}.json`), data || ''));
})();
