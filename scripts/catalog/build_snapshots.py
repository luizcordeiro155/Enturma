"""Build reviewed factual snapshots from downloaded official sources (no generated curricula).

Requires beautifulsoup4 and pymupdf. Source files are local review inputs, never runtime secrets.
Run with --sources PATH; institutional PDFs remain with their publishers, not in Git.
"""
import argparse
import hashlib
import json
import re
import unicodedata
import uuid
from collections import Counter
from pathlib import Path
import pymupdf
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
STAMP = "2026-09-29T03:30:00Z"

def clean(text): return re.sub(r"\s+", " ", text or "").strip()
def norm(text): return re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFD", text.lower()).encode("ascii", "ignore").decode()).strip()
def identity(provider, kind, key):
    value=bytearray(hashlib.md5(f"enturma:catalog:{provider}:{kind}:{key}".encode()).digest())
    value[6]=(value[6]&15)|48; value[8]=(value[8]&63)|128
    return str(uuid.UUID(bytes=bytes(value)))

class Snapshot:
    def __init__(self, provider): self.provider=provider; self.entries=[]; self.keys=set()
    def add(self, kind, key, name, parent, source, attrs=None, **fields):
        assert (kind,key) not in self.keys, (kind,key)
        self.keys.add((kind,key))
        record=dict(externalId=key,kind=kind,parentExternalId=parent,name=name,status="VERIFIED",source=source,attributes=attrs or {})
        record.update(fields);self.entries.append(record);return key
    def write(self):
        directory=ROOT/'services/api/src/main/resources/catalog';directory.mkdir(parents=True,exist_ok=True)
        (directory/(self.provider.lower()+'.json')).write_text(json.dumps(dict(provider=self.provider,entries=self.entries),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        return dict(provider=self.provider,counts=dict(Counter(e['kind'] for e in self.entries)),sources=list({e['source']['url']:e['source'] for e in self.entries}.values()))

def source(path,url,name):
    return dict(url=url,name=name,type='OFFICIAL_PDF' if path.suffix=='.pdf' else 'OFFICIAL_WEBPAGE',contentHash=hashlib.sha256(path.read_bytes()).hexdigest(),retrievedAt=STAMP,verifiedAt=STAMP)

def una(root):
    out=Snapshot('UNA'); directory=root/'una'
    page_source=source(root/'una-aimores.html','https://www.una.br/unidades/aimores','UNA — unidade Aimorés')
    out.add('INSTITUTION','una-344','Centro Universitário UNA',None,page_source,dict(shortName='UNA',emecCode='344',organizationType='CENTRO_UNIVERSITARIO',city='Belo Horizonte',state='MG',websiteUrl='https://www.una.br'))
    out.add('CAMPUS','campus-1842','Campus Sede Aimorés','una-344',page_source,dict(city='Belo Horizonte',state='MG',addressLabel='R. dos Aimorés, 1451 - Lourdes, Belo Horizonte - MG, 30140-071'),code='1842')
    concepts={}; issues=[]
    for item in json.loads((directory/'manifest.json').read_text()):
        path=directory/item['file']; doc=pymupdf.open(path)
        tables=doc[0].find_tables().tables
        if len(tables)!=1: issues.append(dict(file=item['file'],reason='Layout não confirmado'));continue
        rows=tables[0].extract(); name=clean(rows[0][2]); name=re.sub(r'^(Superior de Tecnologia em|Bacharelado em|Licenciatura em)\s+','',name)
        degree='TECHNOLOGIST' if 'Superior de Tecnologia' in clean(rows[0][2]) else 'LICENTIATE' if 'Licenciatura' in clean(rows[0][2]) else 'BACHELOR'
        total=int(re.search(r'(\d+) Horas',clean(rows[3][0])).group(1)); minimum=int(re.search(r'Mínimo:\s*(\d+)',clean(rows[3][3])).group(1))
        modality={'Presencial':'PRESENTIAL','EAD':'REMOTE','Semipresencial':'HYBRID'}[item['modality']]
        src=source(path,item['url'],'UNA — matriz E2A Radial — '+name)
        # These IDs describe source identities, not invented institutional discipline codes.
        offering=item['slug']+'-aimores-'+modality.lower(); version='E2A-Radial-'+src['contentHash'][:12]; curriculum=offering+'-'+version
        learning='IT' if any(word in item['slug'] for word in ['sistemas','computacao','software','redes','dados','seguranca','jogos']) else 'OTHER'
        attrs=dict(degreeType=degree,modality=modality,durationPeriods=minimum,learningArea=learning,coursePage=item['coursePage'],aliases='ADS' if name.startswith('Análise') else '')
        if name in concepts: attrs['courseId']=concepts[name]
        else: concepts[name]=identity('UNA','COURSE',offering)
        out.add('COURSE',offering,name,'campus-1842',src,attrs)
        out.add('CURRICULUM',curriculum,'E2A Radial · '+item['modality'],offering,src,dict(totalWorkloadHours=total,minimumPeriods=minimum,organization='LEVELS',note='A fonte organiza UCs por níveis que abrangem vários semestres. Não informa vigência por ingresso. Confira a matriz vinculada à sua matrícula no Ulife.',coursePage=item['coursePage']),curriculumVersion=version)
        sections=[]; current=None; summary=[]
        for row in rows:
            if clean(row[0]) in ('NIVEL','NÍVEL'):
                current=dict(labels=[],rows=[]);sections.append(current)
            elif any('RESUMO DOS COMPONENTES' in clean(v) for v in row): current=None
            elif current is not None:
                if row[0]: current['labels'].append(row[0])
                if len(row)>9 and row[3] and row[9] and str(row[9]).isdigit(): current['rows'].append(row)
            elif len(row)>9 and row[1]=='ACG' and row[9] and str(row[9]).isdigit():summary.append(row)
        subjects=[]; total_rows=0
        for number,section in enumerate(sections,1):
            labels=' '.join(section['labels']); semester=re.search(r'Semestres\s*(\d+)(?:\s*-\s*(\d+))?',labels)
            if not semester: raise ValueError(f"Semestres sem confirmação: {item['file']}, bloco {number}")
            letters=re.sub(r'\s+','',labels.split('Semestres')[0]); level=letters.capitalize()
            period=curriculum+f'-nivel-{number}'
            last=semester[2] or semester[1]
            out.add('PERIOD',period,f'{level} · semestres {semester[1]}–{last}',curriculum,src,dict(semesterFrom=int(semester[1]),semesterTo=int(last),organization='LEVEL'),periodNumber=number)
            for index,row in enumerate(section['rows']):
                subject_name=clean(row[3]); hours=int(row[9]); total_rows+=hours
                subject_key=period+f'-uc-{index+1}'
                subjects.append(dict(key=subject_key,name=subject_name,parent=period,hours=hours,raw=clean(row[2]),order=index,component=clean(row[1])))
        if summary and not any(s['component']=='ACG' for s in subjects):
            period=curriculum+'-complementares'
            out.add('PERIOD',period,'Componentes complementares · sem semestre definido',curriculum,src,dict(organization='COMPLEMENTARY'),periodNumber=len(sections)+1)
            for index,row in enumerate(summary):
                hours=int(row[9]);total_rows+=hours
                subjects.append(dict(key=period+f'-acg-{index}',name=clean(row[2]),parent=period,hours=hours,raw='',order=index,component='ACG'))
        workload_consistent=total_rows==total
        if not workload_consistent:
            issues.append(dict(file=item['file'],reason='Soma das células diverge do total declarado; grade aguarda revisão',extracted=total_rows,declared=total))
        known={norm(s['name']):s for s in subjects}; ordered=[]; remaining=subjects.copy()
        # Resolve only exact names appearing in the prerequisite cell; keep unresolved text for review.
        for s in subjects:
            raw=norm(s['raw']); dependencies=[]
            if raw and raw!='nsa':
                for candidate in sorted(known,key=len,reverse=True):
                    if candidate in raw and known[candidate]['key']!=s['key']:
                        dependencies.append(known[candidate]['key']);raw=raw.replace(candidate,' ')
                if norm(raw): dependencies=[];issues.append(dict(file=item['file'],subject=s['name'],reason='Pré-requisito mantido como texto; sem relação inferida'))
            s['dependencies']=dependencies
        while remaining:
            available=[s for s in remaining if all(k in {v['key'] for v in ordered} for k in s['dependencies'])]
            if not available: raise ValueError('Ciclo de pré-requisitos')
            for s in available:ordered.append(s);remaining.remove(s)
        for s in ordered:
            out.add('SUBJECT',s['key'],s['name'],s['parent'],src,dict(workloadHours=s['hours'],orderIndex=s['order'],required=True,componentType=s['component'],prerequisites=s['dependencies'],prerequisiteText=s['raw'],learningArea=learning))
        if not workload_consistent:
            for record in out.entries:
                if record['externalId'].startswith(curriculum):record['status']='PENDING_VERIFICATION'
    # Catalog known offerings even when the institution has not published a verified curriculum.
    prouni=source(root/'una-prouni.pdf','https://estaticos.animaeducacao.com.br/medias/20260112095834/ProUni_2026.1_-_Tabela_de_Vagas_-_UNA.pdf','UNA — ofertas ProUni 2026.1')
    data=json.loads((root/'una-prouni-tables.json').read_text(encoding='utf-8'))
    for table in data:
        for row in table:
            if not row[0] or not row[0].startswith('344 - '):continue
            campus_match=re.match(r'(\d+)\s*-\s*(.+)',clean(row[1]));course_match=re.match(r'(\d+)\s*-\s*(.+)',clean(row[2]))
            if not campus_match or not course_match:continue
            campus='campus-'+campus_match[1]
            if ('CAMPUS',campus) not in out.keys:out.add('CAMPUS',campus,campus_match[2],'una-344',prouni,code=campus_match[1])
            key=f'prouni-2026-{campus_match[1]}-{course_match[1]}-{clean(row[3])}'
            if ('COURSE',key) in out.keys:continue
            attrs=dict(emecCourseCode=course_match[1],catalogNote='Oferta documentada no ProUni 2026.1. Grade desta oferta ainda em verificação.')
            shift={'M':'MORNING','N':'EVENING','V':'AFTERNOON','I':'FULL_TIME','EAD':'REMOTE'}.get(clean(row[3]))
            if shift:attrs['shift']=shift
            if shift=='REMOTE':attrs['modality']='REMOTE'
            out.add('COURSE',key,course_match[2],campus,prouni,attrs)
    (root/'una-review-notes.json').write_text(json.dumps(issues,ensure_ascii=False,indent=2),encoding='utf-8')
    return out

def puc(root):
    out=Snapshot('PUCMINAS')
    configs=[('puc-barreiro-si','Barreiro','Sistemas de Informação','https://www.pucminas.br/campus/barreiro/ensino/graduacao/Paginas/Sistemas-de-Informacao.aspx?moda=2'),('puc-pocos-cc','Poços de Caldas','Ciência da Computação','https://www.pucminas.br/campus/pocos-de-caldas/ensino/graduacao/Paginas/ci%C3%AAncia-da-computacao.aspx')]
    for filename,campus,name,url in configs:
        path=root/(filename+'.html');src=source(path,url,'PUC Minas — '+name+' — '+campus);soup=BeautifulSoup(path.read_bytes(),'html.parser')
        if not out.entries:out.add('INSTITUTION','pucminas','Pontifícia Universidade Católica de Minas Gerais',None,src,dict(shortName='PUC Minas',state='MG',websiteUrl='https://www.pucminas.br'))
        out.add('CAMPUS',filename+'-campus',campus,'pucminas',src,dict(state='MG'))
        tables=soup.select('table.tab_listagem_maiuscula_curso'); assert len(tables)%8==0
        shift_rows=soup.select_one('table.puc-pl-graduacao-tabela').select('tr')[1:]
        for group in range(len(tables)//8):
            shift_label=clean(shift_rows[group].select('td')[0].get_text());shift={'NOITE':'EVENING','MANHÃ':'MORNING'}[shift_label]
            offering=filename+'-'+shift.lower();curriculum=offering+'-snapshot-'+src['contentHash'][:12]
            out.add('COURSE',offering,name,filename+'-campus',src,dict(degreeType='BACHELOR',modality='PRESENTIAL',shift=shift,durationPeriods=8,learningArea='IT'))
            out.add('CURRICULUM',curriculum,'Matriz publicada · consulta 29/09/2026',offering,src,dict(minimumPeriods=8,note='Versão identificada pela captura da página oficial; o ano de ingresso não é informado pela página.'),curriculumVersion='captura-'+src['contentHash'][:12])
            for period_num,table in enumerate(tables[group*8:(group+1)*8],1):
                period=curriculum+'-p'+str(period_num);out.add('PERIOD',period,f'{period_num}º período',curriculum,src,periodNumber=period_num)
                for order,row in enumerate(table.select('tr')[1:]):
                    cells=row.find_all('td',recursive=False)
                    if len(cells)<2:continue
                    title=cells[0].select_one('.puc-pl-graduacao-link-ementa')
                    if not title:continue
                    hours=clean(cells[1].get_text());assert hours.isdigit()
                    out.add('SUBJECT',period+'-s'+str(order),clean(title.get_text()),period,src,dict(workloadHours=int(hours),orderIndex=order,learningArea='IT',prerequisiteText=clean(cells[2].get_text(' ',strip=True))))
    return out

def ufmg(root):
    out=Snapshot('UFMG');src=source(root/'ufmg-si.pdf','https://dcc.ufmg.br/wp-content/uploads/versao_curricular_bsi_20250102.pdf','UFMG — Sistemas de Informação — percurso N-2019/9, relatório de 02/01/2025')
    campus_source=source(root/'ufmg-campus.html','https://dcc.ufmg.br/painel-futuro-aluno/','DCC UFMG — graduação e campus Pampulha')
    out.add('INSTITUTION','ufmg','Universidade Federal de Minas Gerais',None,campus_source,dict(shortName='UFMG',state='MG',websiteUrl='https://ufmg.br'))
    out.add('CAMPUS','pampulha','Campus Pampulha','ufmg',campus_source,dict(city='Belo Horizonte',state='MG'))
    out.add('COURSE','si-noturno','Sistemas de Informação','pampulha',src,dict(degreeType='BACHELOR',modality='PRESENTIAL',shift='EVENING',durationPeriods=9,learningArea='IT',aliases='SI'))
    out.add('CURRICULUM','si-n2019-9','N-2019/9 · Bacharelado / Formação Livre','si-noturno',src,dict(totalWorkloadHours=3000,minimumPeriods=8),curriculumVersion='N-2019/9')
    text=(root/'ufmg-si.txt').read_text(encoding='utf-8');period=None;seen=set();subjects=[]
    for line in text.splitlines():
        header=re.match(r'\s*(\d+)º PERÍODO',line)
        if header:
            period=int(header[1]);key='si-n2019-9-p'+str(period)
            if ('PERIOD',key) not in out.keys:out.add('PERIOD',key,f'{period}º período','si-n2019-9',src,periodNumber=period)
        if 'ATIVIDADES ACADÊMICAS OPTATIVAS' in line.upper() or 'Atividades acadêmicas optativas' in line:period=None
        match=re.match(r'\s*DIG - ([A-Z]+\d+) - (.+?)\s{2,}(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+[NS]\s+\d+\s+OB\s+(.+?)\s{2,}',line)
        if match and period and (period,match[1]) not in seen:
            seen.add((period,match[1]));subjects.append((period,match[1],clean(match[2]),int(match[6]),clean(match[7])))
    assert len(subjects)>=35,len(subjects)
    code_keys={code:f'si-n2019-9-p{period}-{code}' for period,code,_,_,_ in subjects}
    for order,(period,code,name,hours,prereq) in enumerate(subjects):
        dependencies=[code_keys[c] for c in re.findall(r'[A-Z]+\d+',prereq) if c in code_keys]
        out.add('SUBJECT',code_keys[code],name,f'si-n2019-9-p{period}',src,dict(workloadHours=hours,orderIndex=order,learningArea='IT',prerequisiteText=prereq,prerequisites=dependencies),code=code)
    return out

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--sources',type=Path,required=True);args=parser.parse_args()
    reports=[builder(args.sources).write() for builder in (una,puc,ufmg)]
    (ROOT/'docs/academic-source-manifest.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for report in reports:print(report['provider'],report['counts'])
if __name__=='__main__': main()
