from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit,unquote
import argparse,re

root=Path(__file__).resolve().parent
metadata_paths={'/robots.txt','/sitemap.xml','/ai.txt','/llms.txt','/ads.txt','/humans.txt','/.well-known/security.txt'}
metadata_redirects={'/security.txt':'/.well-known/security.txt','/llm.txt':'/llms.txt'}
class Preview(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
 def do_GET(self):
  self.serve_page()
 def do_HEAD(self):
  self.serve_page()
 def serve_page(self):
  url=urlsplit(self.path);path=unquote(url.path);suffix=('?'+url.query) if url.query else ''
  if path in metadata_redirects:
   self.send_response(308);self.send_header('Location',metadata_redirects[path]+suffix);self.end_headers();return
  if path.endswith('.html') and path!='/404.html' and (root/path.lstrip('/')).is_file():
   target='/' if path=='/index.html' else path[:-5]
   self.send_response(301);self.send_header('Location',target+suffix);self.end_headers();return
  if path=='/':self.path='/index.html'
  elif path.rstrip('/') and '/' not in path.strip('/') and (root/(path.strip('/')+'.html')).is_file():
   if path.endswith('/'):
    self.send_response(301);self.send_header('Location',path.rstrip('/')+suffix);self.end_headers();return
   self.path=path+'.html'
  elif not(path.startswith('/assets/') or path in metadata_paths or path in ('/site.js','/form-utils.js','/style.css','/version.json')):
   self.missing();return
  if self.command=='HEAD':super().do_HEAD()
  else:super().do_GET()
 def list_directory(self,path):self.missing()
 def send_error(self,code,message=None,explain=None):
  if code==404:self.missing()
  else:super().send_error(code,message,explain)
 def missing(self):
  text=(root/'404.html').read_text(encoding='utf-8')
  text=re.sub(r'(href|src)="(?!https?:|mailto:|tel:|#|/)([^"]+)"',lambda m:f'{m.group(1)}="/{m.group(2)}"',text)
  data=text.encode();self.send_response(404);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers()
  if self.command!='HEAD':self.wfile.write(data)
 def log_message(self,*args):pass
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8000);args=parser.parse_args()
 print(f'Local: http://127.0.0.1:{args.port}',flush=True)
 ThreadingHTTPServer(('127.0.0.1',args.port),Preview).serve_forever()
