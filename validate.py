from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re

# Pages the owner deliberately hides from search while keeping them public.
NOINDEX_PAGES={'about.html'}

class Page(HTMLParser):
 def __init__(self):super().__init__();self.refs=[];self.ids=[];self.images=[];self.h1=0;self.meta={}
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='h1':self.h1+=1
  if d.get('id'):self.ids.append(d['id'])
  if tag=='img':self.images.append(d)
  if tag=='meta':self.meta[d.get('name',d.get('property',''))]=d.get('content','')
  for key in ('srcset','imagesrcset'):
   if d.get(key):
    for candidate in d[key].split(','):
     self.refs.append(candidate.strip().split()[0])
  for key in ('href','src','data-src','data-photo'):
   if d.get(key):self.refs.append(d[key])

def validate(root):
 pages={p.name:Page() for p in root.glob('*.html')};errors=[];descriptions=[]
 for name,a in pages.items():a.feed((root/name).read_text(encoding='utf-8'))
 for name,a in pages.items():
  if a.h1!=1:errors.append(f'{name}: expected one h1')
  if len(a.ids)!=len(set(a.ids)):errors.append(f'{name}: duplicate IDs')
  for field in ('description','og:title','og:description','og:image','twitter:card'):
   if not a.meta.get(field):errors.append(f'{name}: missing {field}')
  descriptions.append(a.meta.get('description'))
  for image in a.images:
   if 'alt' not in image:errors.append(f'{name}: missing alt attribute')
   if image.get('src') and not(image.get('width') and image.get('height')):errors.append(f'{name}: missing image dimensions')
  for ref in a.refs:
   u=urlsplit(ref)
   if u.scheme or u.netloc:continue
   target=root/unquote(u.path).lstrip('/') if u.path else root/name
   if u.path=='/':target=root/'index.html'
   elif u.path.startswith('/') and not target.suffix and (root/(u.path.lstrip('/')+'.html')).exists():target=root/(u.path.lstrip('/')+'.html')
   if not target.exists():errors.append(f'{name}: missing link or asset {ref}');continue
   if u.fragment and target.name in pages and u.fragment not in pages[target.name].ids:errors.append(f'{name}: missing anchor {ref}')
  content=(root/name).read_text(encoding='utf-8')
  if re.search(r'href="[a-z0-9-]+\.html(?:#|\")',content):errors.append(f'{name}: navigation must use clean hosted URLs')
  if name in NOINDEX_PAGES:
   if 'noindex' not in a.meta.get('robots',''):errors.append(f'{name}: expected noindex on this intentionally hidden page')
  elif name!='404.html' and 'noindex' in a.meta.get('robots',''):errors.append(f'{name}: release page is blocked from indexing')
 if len(descriptions)!=len(set(descriptions)):errors.append('Descriptions must be unique')
 sitemap=(root/'sitemap.xml').read_text(encoding='utf-8')
 for name in NOINDEX_PAGES:
  if f'/{name[:-5]}<' in sitemap:errors.append(f'{name}: noindex page must not be listed in sitemap.xml')
 for css in root.glob('assets/*.css'):
  for url in re.findall(r'url\([\"\']?([^\)\"\']+)',css.read_text(encoding='utf-8')):
   if not url.startswith(('data:','https:')) and not(css.parent/url).exists():errors.append(f'{css.name}: missing {url}')
 js=(root/'site.js').read_text(encoding='utf-8')
 if '/api/pageview' in js:errors.append('Legacy custom analytics endpoint is not included in this release')
 for p in list(root.glob('*.html'))+list(root.glob('*.js')):
  text=p.read_text(encoding='utf-8')
  if re.search(r'AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----',text):errors.append(f'{p.name}: potential credential')
 if errors:raise ValueError('\n'.join(errors))
 return len(pages)

if __name__=='__main__':print(f'Passed checks for {validate(Path(__file__).resolve().parent)} pages: local links, image references, metadata, clean navigation, and no legacy analytics endpoint.')
