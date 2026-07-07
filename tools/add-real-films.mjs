import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(process.cwd());
const itemsPath = path.join(root, "items.js");
const postersDir = path.join(root, "posters");

const films = [
  {
    id: "film-001",
    title: "小偷家族",
    originalTitle: "Shoplifters",
    year: 2018,
    score: "8.7",
    genre: "家庭",
    hot: 18020,
    page: "https://filmartgallery.com/products/shoplifters-1"
  },
  {
    id: "film-002",
    title: "驾驶我的车",
    originalTitle: "Drive My Car",
    year: 2021,
    score: "8.4",
    genre: "剧情",
    hot: 17860,
    page: "https://filmartgallery.com/products/drive-my-car"
  },
  {
    id: "film-003",
    title: "无人知晓",
    originalTitle: "Nobody Knows",
    year: 2004,
    score: "9.1",
    genre: "剧情",
    hot: 17610,
    page: "https://filmartgallery.com/products/nobody-knows"
  },
  {
    id: "film-004",
    title: "入殓师",
    originalTitle: "Departures",
    year: 2008,
    score: "8.9",
    genre: "剧情",
    hot: 17420,
    page: "https://filmartgallery.com/products/departures"
  },
  {
    id: "film-005",
    title: "大逃杀",
    originalTitle: "Battle Royale",
    year: 2000,
    score: "8.0",
    genre: "惊悚",
    hot: 17340,
    page: "https://filmartgallery.com/products/battle-royale"
  },
  {
    id: "film-006",
    title: "告白",
    originalTitle: "Confessions",
    year: 2010,
    score: "8.8",
    genre: "悬疑",
    hot: 17280,
    page: "https://filmartgallery.com/products/confessions"
  },
  {
    id: "film-007",
    title: "海街日记",
    originalTitle: "Our Little Sister",
    year: 2015,
    score: "8.8",
    genre: "家庭",
    hot: 17130,
    page: "https://filmartgallery.com/products/our-little-sister"
  },
  {
    id: "film-008",
    title: "花火",
    originalTitle: "Hana-bi",
    year: 1997,
    score: "8.7",
    genre: "犯罪",
    hot: 16980,
    page: "https://filmartgallery.com/products/fireworks-hana-bi"
  }
];

function normalizeImage(url) {
  return url.replace(/_(240|400|600|800|1200)x(?=\.jpg)/, "_800x");
}

async function findImage(page) {
  const res = await fetch(page, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(18000) });
  if (!res.ok) throw new Error(`${res.status} ${page}`);
  const html = await res.text();
  const match = html.match(/<meta property="og:image" content="([^"]+)"/) || html.match(/imagesrcset="([^"]+)"/);
  if (!match) throw new Error(`No image ${page}`);
  const raw = match[1].includes(",") ? match[1].split(",").at(-1).trim().split(" ")[0] : match[1];
  return normalizeImage(raw.startsWith("//") ? `https:${raw}` : raw);
}

async function downloadImage(url, file) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(18000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) throw new Error(`Image too small ${url}`);
  await fs.writeFile(file, buf);
}

const context = { window: {} };
vm.runInNewContext(await fs.readFile(itemsPath, "utf8"), context);
const existing = Array.isArray(context.window.SITE_ITEMS) ? context.window.SITE_ITEMS : [];
const withoutOld = existing.filter((item) => !String(item.id).startsWith("film-"));
const added = [];

for (const film of films) {
  try {
    const image = await findImage(film.page);
    const poster = `./posters/${film.id}.jpg`;
    await downloadImage(image, path.join(postersDir, `${film.id}.jpg`));
    added.push({
      id: film.id,
      title: film.title,
      originalTitle: film.originalTitle,
      kind: "电影",
      year: film.year,
      score: film.score,
      genre: film.genre,
      hot: film.hot,
      summary: `${film.title}是日影青空站收录的日本电影内容，整理真实海报或剧照、年份评分、${film.genre}题材、剧情介绍、导演演员资料和观影指南，适合查找日本电影推荐、经典日影与高清免费观影信息。`,
      poster
    });
    console.log(`added ${film.title}`);
  } catch (error) {
    console.warn(`skip ${film.title}: ${error.message}`);
  }
}

const next = [...added, ...withoutOld];
await fs.writeFile(itemsPath, `window.SITE_ITEMS = ${JSON.stringify(next, null, 2)};\n`, "utf8");
console.log(`films=${added.length} total=${next.length}`);
