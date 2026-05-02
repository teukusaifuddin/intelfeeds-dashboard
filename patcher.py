import re, ast, sys

SRC = "/Users/teukusaifuddin/Documents/intelfeeds/ingest_v7_original.py"
DST = "/Users/teukusaifuddin/Documents/intelfeeds/ingest_v7_patched.py"

with open(SRC) as f:
    c = f.read()

c = c.replace(
    "from trafilatura.settings import use_config",
    "from trafilatura.settings import use_config\nfrom smart_classifier import classify, is_relevant"
)
print("1/4 import added")

c = re.sub(r'\nSOURCE_OVERRIDE = \{.*?return "geopolitical"\n', '\n', c, flags=re.DOTALL)
print("2/4 inline classifier removed")

NEW_UPSERT = '''def upsert(title, url, source, type_, content=None, published=None):
    JUNK = {"services > navy","our partners","about us","contact us",
        "privacy policy","cookie policy","terms of service","sign in",
        "log in","home","search","subscribe","newsletter",
        "site.webmanifest","the download","all rights reserved",
        "watch download all top stories across military world"}
    ASSET = (".css",".js",".png",".jpg",".jpeg",".gif",".svg",
        ".woff",".woff2",".ttf",".ico",".pdf",".zip",".mp4",".mp3",".webmanifest")
    uc = url.lower().split("?")[0].split("#")[0]
    if any(uc.endswith(e) for e in ASSET): return False
    if not title or not url or len(title.strip()) < 12: return False
    tl = title.lower().strip()
    if tl in JUNK or any(tl.endswith(e) for e in ASSET): return False
    if re.match(r"^[0-9a-f\\-_\\.]+$", tl.replace(" ","")): return False
    try:
        text = title + " " + (content or "")
        if not is_relevant(text): return False
        cat = classify(text, source=source)
        score = priority_score(text)
        data = {"title":title[:500],"url":url[:1000],"source":source[:100],
                "type":type_,"category":cat,"priority_score":score}
        if content: data["content"] = content[:3000]
        if published: data["published_at"] = published
        sb.table("feeds").upsert(data, on_conflict="url").execute()
        return True
    except: return False

'''
c = re.sub(r'def upsert\(.*?except:\s*return False\n\n', NEW_UPSERT, c, flags=re.DOTALL)
print("3/4 upsert fixed")

c = c.replace('datetime.now().isoformat()', 'None')
print("4/4 timestamps fixed")

with open(DST, "w") as f:
    f.write(c)

try:
    ast.parse(c)
    print(f"\nOK -> {DST}")
except SyntaxError as e:
    print(f"\nSYNTAX ERROR: {e}")
    sys.exit(1)