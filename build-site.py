from pathlib import Path
import argparse,importlib.util,os,shutil,tempfile
from validate import validate

root=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--url',default=os.environ.get('SITE_URL') or os.environ.get('URL'));args=parser.parse_args()
if not args.url:parser.error('Supply --url or SITE_URL with the final HTTPS site root.')
validate(root)
spec=importlib.util.spec_from_file_location('prepare',root/'prepare-deploy.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
dist=root/'dist';dist.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='.build-',dir=root) as temporary:
 stage=Path(temporary).resolve()
 assert stage.is_relative_to(root)
 for p in root.glob('*.html'):shutil.copy2(p,stage/p.name)
 for name in ('style.css','site.js','form-utils.js','_headers','_redirects','.htaccess','robots.txt','version.json'):shutil.copy2(root/name,stage/name)
 shutil.copytree(root/'assets',stage/'assets')
 count=module.prepare(stage,args.url)
 validate(stage)
 # Replace only files in this dedicated build directory; retain source files untouched.
 for p in stage.iterdir():
  if p.is_dir():shutil.copytree(p,dist/p.name,dirs_exist_ok=True)
  else:shutil.copy2(p,dist/p.name)
print(f'Built release v1.0.0: {count} indexable pages in {dist}')
