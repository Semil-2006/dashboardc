import os
import re
import requests
import browser_cookie3

SHAREPOINT_URL = (
    "https://caesbdfgovbr.sharepoint.com/:x:/r/sites/PRGC2/_layouts/15/Doc.aspx"
    "?sourcedoc=%7BD33B7D0A-8470-4A52-8C4E-03F30ACC8731%7D"
    "&file=Risco%20de%20Integridade%20-%20Controle%20Estatistico%20PRGA.xlsx"
    "&action=default&mobileredirect=true"
)
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "Risco de Integridade - Controle Estatistico PRGA.xlsx")


def get_chrome_cookies():
    jars = []
    for domain in ["sharepoint.com", "microsoft.com", "microsoftonline.com"]:
        try:
            cj = browser_cookie3.chrome(domain_name=domain)
            jars.append(cj)
        except:
            pass

    merged = requests.cookies.RequestsCookieJar()
    for jar in jars:
        for cookie in jar:
            merged.set(cookie.name, cookie.value, domain=cookie.domain, path=cookie.path)
    return merged


def download_via_unique_id(session, unique_id):
    """Download using the download.aspx endpoint with UniqueId (confirmed working)."""
    dl_url = (
        f"https://caesbdfgovbr.sharepoint.com/sites/PRGC2/_layouts/15/download.aspx"
        f"?UniqueId={unique_id}&Translate=false"
    )
    print(f"  Download direto via UniqueId: {dl_url}")
    resp = session.get(dl_url, allow_redirects=True, timeout=60)
    ct = resp.headers.get("Content-Type", "")
    print(f"  Status: {resp.status_code}, Content-Type: {ct}, Size: {len(resp.content)} bytes")

    if resp.status_code == 200 and len(resp.content) > 10000 and resp.content.startswith(b'PK\x03\x04'):
        with open(OUTPUT_PATH, "wb") as f:
            f.write(resp.content)
        return True
    return False


def extract_unique_id_from_html(html):
    """Extract the UniqueId (GUID) from the SharePoint page HTML."""
    # Look for the UniqueId in various patterns
    patterns = [
        r'UniqueId[=:]["\']?([a-f0-9\-]{36})',
        r'UniqueId["\']?\s*[:=]\s*["\']([a-f0-9\-]{36})',
        r'([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})',
    ]
    for p in patterns:
        m = re.search(p, html, re.I)
        if m:
            return m.group(1).lower()
    return None


def download_excel():
    print("Obtendo cookies do Chrome...")
    cookies = get_chrome_cookies()
    print(f"Cookies carregados: {len(cookies)}")

    session = requests.Session()
    session.cookies.update(cookies)
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    })

    # Step 1: Get UniqueId from URL's sourcedoc parameter (more reliable)
    m_url = re.search(r'sourcedoc=%7B([a-f0-9\-]{36})%7D', SHAREPOINT_URL, re.I)
    if m_url:
        unique_id = m_url.group(1).lower()
        print(f"  UniqueId extraído da URL: {unique_id}")
    else:
        # Fallback: extract from page HTML
        print("Acessando página do SharePoint...")
        resp = session.get(SHAREPOINT_URL, allow_redirects=True, timeout=60)
        unique_id = extract_unique_id_from_html(resp.text)
        print(f"  UniqueId extraído da página: {unique_id}")

    # Step 2: Try direct download with UniqueId
    if unique_id:
        print("\nTentando download via UniqueId...")
        if download_via_unique_id(session, unique_id):
            print(f"\nDownload concluído: {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH)} bytes)")
            return OUTPUT_PATH

    # Step 3: Try to find download links in the page
    print("\nBuscando links de download na página...")
    if "resp" not in locals():
        resp = session.get(SHAREPOINT_URL, allow_redirects=True, timeout=60)
    dl_links = re.findall(
        r'(https?://[^"\'<>]+download[^"\']*)',
        resp.text
    )
    for link in dl_links[:10]:
        clean = link.replace("\\u0026", "&").replace("&amp;", "&")
        print(f"  Tentando: {clean[:120]}...")
        resp2 = session.get(clean, allow_redirects=True, timeout=30)
        if resp2.status_code == 200 and len(resp2.content) > 10000 and resp2.content.startswith(b'PK\x03\x04'):
            with open(OUTPUT_PATH, "wb") as f:
                f.write(resp2.content)
            print(f"Download concluído via link direto: {OUTPUT_PATH}")
            return OUTPUT_PATH

    # Step 4: Try the direct file URL
    print("\nTentando URL direta do arquivo...")
    direct_url = (
        "https://caesbdfgovbr.sharepoint.com/sites/PRGC2/"
        "Documentos%20Partilhados/Variaveis%20de%20Integridade/"
        "Risco%20de%20Integridade%20-%20Controle%20Estatistico%20PRGA.xlsx"
    )
    resp3 = session.get(direct_url, allow_redirects=True, timeout=60)
    if resp3.status_code == 200 and len(resp3.content) > 10000 and resp3.content.startswith(b'PK\x03\x04'):
        with open(OUTPUT_PATH, "wb") as f:
            f.write(resp3.content)
        print(f"Download concluído: {OUTPUT_PATH}")
        return OUTPUT_PATH

    print("\nERRO: Não foi possível baixar o arquivo.")
    print("Verifique se você está logado no SharePoint no Chrome.")
    return None


if __name__ == "__main__":
    result = download_excel()
    if result:
        print(f"\nArquivo salvo em: {result}")
    else:
        print("\nFalha no download.")
        exit(1)
