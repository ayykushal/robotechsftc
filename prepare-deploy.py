"""Set final HTTPS origin, metadata, indexing and sitemap before uploading this folder."""
from pathlib import Path
from urllib.parse import urlsplit
from xml.sax.saxutils import escape
import argparse, re

def clean_url_rules(pages):
 rules=['/index.html / 301!','/security.txt /.well-known/security.txt 301','/llm.txt /llms.txt 301']
 for page in pages:
  if page.name in ('index.html','404.html'):continue
  route='/'+page.stem
  rules.extend(['/'+page.name+' '+route+' 301!',route+'/ '+route+' 301!',route+' /'+page.name+' 200'])
 rules.append('/* /404.html 404')
 return '\n'.join(rules)+'\n'

def prepare(root,url):
 parsed=urlsplit(url)
 if parsed.scheme!='https' or not parsed.netloc or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in ('','/'):
  raise ValueError('Use the final HTTPS site root, such as https://your-domain.org (no path, credentials, query or fragment).')
 origin=url.rstrip('/')
 pages=sorted(root.glob('*.html'));urls=[]
 for p in pages:
  s=p.read_text(encoding='utf-8');path='/' if p.name=='index.html' else '/'+p.stem;absolute=origin+path
  s=re.sub(r'<link rel="canonical"[^>]*>','',s)
  s=re.sub(r'<meta property="og:url"[^>]*>','',s)
  s=s.replace('</head>',f'<link rel="canonical" href="{escape(absolute)}"><meta property="og:url" content="{escape(absolute)}"></head>')
  for prop in ('property="og:image"','name="twitter:image"'):
   s=re.sub('(<meta '+prop+' content=")[^"]*(")',lambda m:m.group(1)+origin+'/assets/social-preview-competition-v2.png'+m.group(2),s)
  if p.name!='404.html':
   s=s.replace('name="robots" content="noindex, nofollow"','name="robots" content="index, follow"');urls.append(absolute)
  else:
   # A 404 can be served at a nested missing URL: resources must resolve from the site root.
   s=re.sub(r'(href|src)="(?!https?:|mailto:|tel:|#|/)([^"]+)"',lambda m:f'{m.group(1)}="{origin}/{m.group(2)}"',s)
  p.write_text(s,encoding='utf-8')
 xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{escape(u)}</loc></url>\n' for u in urls)+'</urlset>\n'
 (root/'sitemap.xml').write_text(xml,encoding='utf-8')
 (root/'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {origin}/sitemap.xml\n',encoding='utf-8')
 security=root/'.well-known/security.txt'
 if security.is_file():
  content=re.sub(r'^Canonical: .+$',lambda match:f'Canonical: {origin}/.well-known/security.txt',security.read_text(encoding='utf-8'),flags=re.M)
  security.write_text(content,encoding='utf-8')
 host=parsed.netloc
 (root/'_redirects').write_text(f'http://{host}/* {origin}/:splat 301!\n'+clean_url_rules(pages),encoding='utf-8')
 headers=(root/'_headers').read_text(encoding='utf-8')
 if 'Strict-Transport-Security' not in headers:headers=headers.replace('/*\n','/*\n  Strict-Transport-Security: max-age=31536000\n',1)
 (root/'_headers').write_text(headers,encoding='utf-8')
 return len(urls)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--url',required=True);args=parser.parse_args()
 count=prepare(Path(__file__).resolve().parent,args.url)
 print(f'Prepared {count} sitemap URLs. Upload the folder to an HTTPS-enabled host; verify redirects and headers after deployment.')
