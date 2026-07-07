import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(process.cwd());
const itemsPath = path.join(root, "items.js");
const postersDir = path.join(root, "posters");

const films = [
  ["film-002", "电车狂", "Dodesukaden", 1970, "8.2", "剧情", 17720, "https://cdn.shopify.com/s/files/1/1057/4964/files/Dodesukaden-Vintage-Movie-Poster-Original_60f0f64d.jpg?v=1771979634"],
  ["film-003", "影武者", "Kagemusha", 1980, "8.9", "历史", 17680, "https://cdn.shopify.com/s/files/1/1057/4964/files/Kagemusha-Vintage-Movie-Poster-Original_1daed4e4.jpg?v=1771983886"],
  ["film-004", "怪谈雪女郎", "The Snow Woman", 1968, "7.8", "奇幻", 17430, "https://cdn.shopify.com/s/files/1/1057/4964/files/The-Snow-Woman-Vintage-Movie-Poster-Original.jpg?v=1780556410"],
  ["film-005", "乱", "Ran", 1985, "8.9", "历史", 17390, "https://cdn.shopify.com/s/files/1/1057/4964/files/Ran-Vintage-Movie-Poster-Original.jpg?v=1771978363"],
  ["film-006", "罗生门", "Rashomon", 1950, "8.8", "悬疑", 17330, "https://cdn.shopify.com/s/files/1/1057/4964/files/Rashomon-Vintage-Movie-Poster-Original.jpg?v=1771978433"],
  ["film-007", "七武士", "Seven Samurai", 1954, "9.3", "动作", 17290, "https://cdn.shopify.com/s/files/1/1057/4964/files/Seven-Samurai-Vintage-Movie-Poster-Original.jpg?v=1771978698"],
  ["film-008", "梦", "Dreams", 1990, "8.7", "奇幻", 17180, "https://cdn.shopify.com/s/files/1/1057/4964/files/Dreams-Vintage-Movie-Poster-Original.jpg?v=1771979490"]
];

async function download(url, file) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) throw new Error(`small image ${url}`);
  await fs.writeFile(file, buf);
}

const context = { window: {} };
vm.runInNewContext(await fs.readFile(itemsPath, "utf8"), context);
const existing = Array.isArray(context.window.SITE_ITEMS) ? context.window.SITE_ITEMS : [];
const oldFilm001 = existing.filter((item) => item.id === "film-001");
const withoutNew = existing.filter((item) => !films.some(([id]) => item.id === id));
const added = [];

for (const [id, title, originalTitle, year, score, genre, hot, image] of films) {
  try {
    await download(image, path.join(postersDir, `${id}.jpg`));
    added.push({
      id,
      title,
      originalTitle,
      kind: "电影",
      year,
      score,
      genre,
      hot,
      summary: `${title}是日影青空站收录的日本电影内容，整理真实海报或剧照、年份评分、${genre}题材、剧情介绍、导演演员资料和观影指南，适合查找日本电影推荐、经典日影与高清免费观影信息。`,
      poster: `./posters/${id}.jpg`
    });
    console.log(`added ${title}`);
  } catch (error) {
    console.warn(`skip ${title}: ${error.message}`);
  }
}

const existingWithoutFilms = withoutNew.filter((item) => item.id !== "film-001");
const next = [...oldFilm001, ...added, ...existingWithoutFilms];
await fs.writeFile(itemsPath, `window.SITE_ITEMS = ${JSON.stringify(next, null, 2)};\n`, "utf8");
console.log(`newFilms=${added.length} total=${next.length}`);
