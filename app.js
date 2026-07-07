const params = new URLSearchParams(location.search);
const page = document.body.dataset.page;
const items = Array.isArray(window.SITE_ITEMS) ? window.SITE_ITEMS : [];

function escapeAttr(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function imageTag(item, loading = "eager") {
  return `<img src="${escapeAttr(item.poster)}" alt="${escapeAttr(item.title)}" loading="${loading}" decoding="async">`;
}

function sortHot(list) {
  return [...list].sort((a, b) => Number(b.hot || 0) - Number(a.hot || 0));
}

function sortScore(list) {
  return [...list].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

function card(item) {
  return `<article class="poster-card">
    <a href="./movie.html?id=${encodeURIComponent(item.id)}">
      <div class="poster">${imageTag(item)}<span>${item.kind}</span></div>
      <div class="poster-info">
        <h3>${item.title}</h3>
        <p>${item.originalTitle}</p>
        <div class="meta"><b>${item.score}</b><em>${item.year}</em><em>${item.genre}</em></div>
      </div>
    </a>
  </article>`;
}

function featureRow(item, index = 0) {
  return `<a class="feature" href="./movie.html?id=${encodeURIComponent(item.id)}">
    <span class="feature-no">${String(index + 1).padStart(2, "0")}</span>
    <div class="feature-thumb">${imageTag(item)}</div>
    <span class="feature-copy"><b>${item.title}</b><small>${item.kind} · ${item.genre} · ${item.year}</small></span>
    <em>${item.score}</em>
  </a>`;
}

function channelBlock(kind, label, note) {
  const list = items.filter((item) => item.kind === kind);
  const top = sortHot(list)[0] || items[0];
  return `<a class="channel-card" href="./library.html?kind=${encodeURIComponent(kind)}">
    <span>${label}</span>
    <strong>${list.length}</strong>
    <small>${note}</small>
    ${top ? imageTag(top) : ""}
  </a>`;
}

function renderHome() {
  const hot = sortHot(items);
  const score = sortScore(items);
  const hero = hot[0];
  document.getElementById("heroStage").innerHTML = `<a href="./movie.html?id=${hero.id}">
    ${imageTag(hero, "eager")}
    <span><b>${hero.title}</b><em>${hero.kind} · ${hero.genre} · ${hero.score}</em></span>
  </a>`;
  document.getElementById("heroRail").innerHTML = hot.slice(1, 5).map((item) => `<a href="./movie.html?id=${item.id}">${imageTag(item, "eager")}<span>${item.title}</span></a>`).join("");
  document.getElementById("channelStats").innerHTML = [
    channelBlock("电影", "日影精选", "经典、院线、剧情与犯罪"),
    channelBlock("日剧", "剧集追看", "都市、悬疑、美食与生活"),
    channelBlock("动漫电影", "动画剧场", "青春、奇幻、冒险与治愈"),
    channelBlock("综艺纪录", "纪实频道", "旅行、美食、文化与人物")
  ].join("");
  document.getElementById("featureList").innerHTML = hot.slice(5, 14).map(featureRow).join("");
  document.getElementById("rankList").innerHTML = score.slice(0, 10).map((item, index) => `<li><a href="./movie.html?id=${item.id}"><span>${String(index + 1).padStart(2, "0")} ${item.title}</span><b>${item.score}</b></a></li>`).join("");
  document.getElementById("homeGrid").innerHTML = hot.slice(0, 40).map(card).join("");
}

function getList() {
  const kind = params.get("kind") || "全部";
  const genre = params.get("genre");
  const sort = params.get("sort") || document.getElementById("sortSelect")?.value || "hot";
  let list = [...items];
  if (kind !== "全部") list = list.filter((item) => item.kind === kind);
  if (genre) list = list.filter((item) => item.genre === genre);
  list.sort((a, b) => sort === "score" ? Number(b.score) - Number(a.score) : sort === "year" ? Number(b.year) - Number(a.year) : Number(b.hot || 0) - Number(a.hot || 0));
  return { list, kind };
}

function renderLibrary() {
  document.querySelectorAll("[data-kind]").forEach((button) => {
    button.onclick = () => {
      const kind = button.dataset.kind;
      location.href = kind === "全部" ? "./library.html" : `./library.html?kind=${encodeURIComponent(kind)}`;
    };
  });
  const select = document.getElementById("sortSelect");
  select.value = params.get("sort") || "hot";
  select.onchange = () => {
    params.set("sort", select.value);
    location.href = `./library.html?${params.toString()}`;
  };
  const { list, kind } = getList();
  document.getElementById("libraryTitle").textContent = kind === "全部" ? "全部日本影视资源" : `${kind}资源库`;
  document.getElementById("resultCount").textContent = `${list.length} 部内容`;
  document.getElementById("libraryGrid").innerHTML = list.map(card).join("");
}

function renderDetail() {
  const item = items.find((entry) => entry.id === params.get("id")) || items[0];
  document.title = `${item.title}-${item.kind}高清资料-日本影视在线观看`;
  document.querySelector("meta[name='description']").setAttribute("content", item.summary);
  document.getElementById("detailRoot").innerHTML = `
    <div class="detail-poster">${imageTag(item, "eager")}</div>
    <article class="detail-copy">
      <p class="eyebrow">${item.kind} · ${item.genre}</p>
      <h1>${item.title}</h1>
      <p class="origin">${item.originalTitle}</p>
      <div class="detail-meta"><span>评分 ${item.score}</span><span>${item.year}</span><span>${item.kind}</span><span>${item.genre}</span></div>
      <p>${item.summary}</p>
      <a class="button primary" href="./library.html?kind=${encodeURIComponent(item.kind)}">浏览同频道内容</a>
    </article>`;
  const related = items.filter((entry) => entry.id !== item.id && (entry.kind === item.kind || entry.genre === item.genre)).slice(0, 8);
  document.getElementById("relatedGrid").innerHTML = related.map(card).join("");
}

function markBrokenImages() {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => {
      img.closest(".poster-card,.feature,.hero-stage,.detail-poster,.channel-card")?.classList.add("image-missing");
    }, { once: true });
  });
}

if (items.length) {
  if (page === "home") renderHome();
  if (page === "library") renderLibrary();
  if (page === "detail") renderDetail();
  markBrokenImages();
}
