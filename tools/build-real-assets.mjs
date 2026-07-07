import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const posterDir = path.join(root, "posters");

const fixedMovies = [
  ["live-001", "怪物", "Monster", "电影", 2023, 8.4, "剧情", "https://upload.wikimedia.org/wikipedia/en/6/60/Monster_2023_film_poster.jpg"],
  ["live-002", "小偷家族", "Shoplifters", "电影", 2018, 8.7, "剧情", "https://upload.wikimedia.org/wikipedia/en/8/8a/Shoplifters_%28film%29.png"],
  ["live-003", "驾驶我的车", "Drive My Car", "电影", 2021, 8.4, "剧情", "https://upload.wikimedia.org/wikipedia/en/6/6f/Drive_My_Car_%282021%29.png"],
  ["live-004", "花束般的恋爱", "We Made a Beautiful Bouquet", "电影", 2021, 8.6, "爱情", "https://upload.wikimedia.org/wikipedia/en/4/4b/We_Made_a_Beautiful_Bouquet.jpg"],
  ["live-005", "海街日记", "Our Little Sister", "电影", 2015, 8.8, "家庭", "https://upload.wikimedia.org/wikipedia/en/3/3f/Our_Little_Sister_%28film%29.jpg"],
  ["live-006", "告白", "Confessions", "电影", 2010, 8.5, "悬疑", "https://upload.wikimedia.org/wikipedia/en/8/8d/Kokuhaku_%282010_film%29_poster.jpg"],
  ["live-007", "入殓师", "Departures", "电影", 2008, 8.8, "剧情", "https://upload.wikimedia.org/wikipedia/en/7/7c/Departures_%282008_film%29_poster.jpg"],
  ["live-008", "如父如子", "Like Father, Like Son", "电影", 2013, 8.3, "家庭", "https://upload.wikimedia.org/wikipedia/en/7/70/Like_Father%2C_Like_Son_%282013_film%29.jpg"],
  ["live-009", "菊次郎的夏天", "Kikujiro", "电影", 1999, 8.8, "剧情", "https://upload.wikimedia.org/wikipedia/en/9/93/Kikujiro_poster.jpg"],
  ["live-010", "情书", "Love Letter", "电影", 1995, 8.9, "爱情", "https://upload.wikimedia.org/wikipedia/en/f/f4/Love_Letter_%281995_film%29_poster.jpg"],
  ["live-011", "无人知晓", "Nobody Knows", "电影", 2004, 8.7, "剧情", "https://upload.wikimedia.org/wikipedia/en/9/93/Nobody_Knows_%282004_film%29.jpg"],
  ["live-012", "被嫌弃的松子的一生", "Memories of Matsuko", "电影", 2006, 8.9, "剧情", "https://upload.wikimedia.org/wikipedia/en/2/2e/Memories_of_Matsuko.jpg"],
  ["live-013", "胜者即是正义", "Legal High", "日剧", 2012, 9.1, "喜剧", "https://static.tvmaze.com/uploads/images/original_untouched/498/1246619.jpg"],
  ["live-014", "孤独的美食家", "Solitary Gourmet", "日剧", 2012, 8.7, "美食", "https://static.tvmaze.com/uploads/images/original_untouched/491/1229441.jpg"],
  ["live-015", "深夜食堂", "Midnight Diner", "日剧", 2009, 8.9, "生活", "https://static.tvmaze.com/uploads/images/original_untouched/248/620533.jpg"],
  ["live-016", "弥留之国的爱丽丝", "Alice in Borderland", "日剧", 2020, 8.2, "悬疑", "https://static.tvmaze.com/uploads/images/original_untouched/589/1473249.jpg"],
  ["live-017", "First Love 初恋", "First Love", "日剧", 2022, 8.5, "爱情", "https://static.tvmaze.com/uploads/images/original_untouched/438/1096909.jpg"],
  ["live-018", "忍者之家", "House of Ninjas", "日剧", 2024, 7.8, "动作", "https://static.tvmaze.com/uploads/images/original_untouched/514/1286816.jpg"],
  ["live-019", "舞伎家的料理人", "The Makanai", "日剧", 2023, 8.1, "生活", "https://static.tvmaze.com/uploads/images/original_untouched/441/1103633.jpg"],
  ["live-020", "火烧御手洗家", "Burn the House Down", "日剧", 2023, 7.6, "悬疑", "https://static.tvmaze.com/uploads/images/original_untouched/470/1176681.jpg"],
  ["live-021", "双层公寓", "Terrace House", "综艺纪录", 2015, 8.0, "真人秀", "https://static.tvmaze.com/uploads/images/original_untouched/34/85871.jpg"]
];

const dramaQueries = [
  "Tokyo Vice", "Gannibal", "Sanctuary", "Followers", "Erased", "Good Morning Call",
  "Atelier", "Switched", "The Naked Director", "My Happy Marriage", "Trillion Game",
  "Vivant", "Brush Up Life", "Doctor-X", "Unnatural", "MIU404", "Hana Yori Dango",
  "Nodame Cantabile", "The Queen of Villains", "Turn to Me Mukai-kun", "Shogun",
  "Burn the House Down", "House of Ninjas", "First Love", "Midnight Diner",
  "Alice in Borderland", "The Makanai", "Solitary Gourmet"
];

function clean(text) {
  return String(text || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function extFromContentType(type, url) {
  if (type?.includes("png") || url.includes(".png")) return ".png";
  if (type?.includes("webp") || url.includes(".webp")) return ".webp";
  return ".jpg";
}

async function download(url, id) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) throw new Error(`not image ${contentType}`);
  const ext = extFromContentType(contentType, url);
  const file = `${id}${ext}`;
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 4000) throw new Error(`too small ${url}`);
  await fs.writeFile(path.join(posterDir, file), buffer);
  return `./posters/${file}`;
}

function movieItem(row) {
  const [id, title, originalTitle, kind, year, score, genre, posterUrl] = row;
  return {
    id, title, originalTitle, kind, year, score: Number(score).toFixed(1), genre, posterUrl,
    hot: 15000 - Number(id.replace(/\D/g, "")) * 31,
    summary: `${title}是日本电影在线收录的${kind}内容，整理真实海报或剧照、年份评分、${genre}题材、剧情介绍、导演演员资料和观影指南，适合查找日本电影推荐、日剧电影、日本动漫电影与经典日影信息。`
  };
}

async function fetchAnime() {
  const results = [];
  for (let page = 1; page <= 4; page++) {
    const json = await fetch(`https://api.jikan.moe/v4/top/anime?type=movie&page=${page}`, {
      headers: { "user-agent": "Mozilla/5.0" }
    }).then((r) => r.json());
    for (const entry of json.data || []) {
      const title = clean(entry.title_english || entry.title);
      if (/Ne Zha|Legend of Hei|Ramayana/i.test(title)) continue;
      results.push({
        id: `anime-${entry.mal_id}`,
        title,
        originalTitle: clean(entry.title_japanese || entry.title),
        kind: "动漫电影",
        year: entry.aired?.prop?.from?.year || 2026,
        score: Number(entry.score || 8).toFixed(1),
        genre: entry.genres?.[0]?.name || "动画",
        posterUrl: entry.images?.jpg?.large_image_url || entry.images?.jpg?.image_url,
        hot: Number(entry.members || 40000),
        summary: `${clean(entry.title_english || entry.title)}收录真实动漫电影海报、评分、年份、题材和观影指南，适合日本动漫电影在线观看与推荐。`
      });
    }
  }
  return results;
}

async function fetchDramas() {
  const results = [];
  for (const query of dramaQueries) {
    const list = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`, {
      headers: { "user-agent": "Mozilla/5.0" }
    }).then((r) => r.json());
    const show = list?.[0]?.show;
    if (!show?.image?.original && !show?.image?.medium) continue;
    results.push({
      id: `drama-${show.id}`,
      title: clean(show.name),
      originalTitle: clean(show.name),
      kind: "日剧",
      year: Number(String(show.premiered || "2026").slice(0, 4)) || 2026,
      score: Number(show.rating?.average || 7.6).toFixed(1),
      genre: show.genres?.[0] || "剧情",
      posterUrl: show.image.original || show.image.medium,
      hot: Number(show.weight || 80) * 100,
      summary: `${clean(show.name)}收录真实剧集海报或剧照、评分、年份、题材和剧情介绍，适合日剧电影、日本影视资源和高清观影指南页面展示。`
    });
  }
  return results;
}

async function main() {
  await fs.rm(posterDir, { recursive: true, force: true });
  await fs.mkdir(posterDir, { recursive: true });

  const candidates = [
    ...fixedMovies.map(movieItem),
    ...(await fetchDramas()),
    ...(await fetchAnime())
  ];

  const seen = new Set();
  const items = [];
  for (const item of candidates) {
    if (!item.posterUrl || seen.has(`${item.title}-${item.year}`)) continue;
    seen.add(`${item.title}-${item.year}`);
    try {
      item.poster = await download(item.posterUrl, item.id);
      delete item.posterUrl;
      items.push(item);
      console.log(`ok ${items.length}: ${item.title}`);
    } catch (error) {
      console.warn(`skip ${item.title}: ${error.message}`);
    }
    if (items.length >= 92) break;
  }

  if (items.length < 80) throw new Error(`only ${items.length} images downloaded`);
  const output = `window.SITE_ITEMS = ${JSON.stringify(items, null, 2)};\n`;
  await fs.writeFile(path.join(root, "items.js"), output, "utf8");
  console.log(`wrote ${items.length} real items`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
