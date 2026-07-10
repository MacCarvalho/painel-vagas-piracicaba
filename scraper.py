#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
import datetime
import requests
from bs4 import BeautifulSoup

def scrape_job_board():
    url = "https://sistemas.pmp.sp.gov.br/semtre/ERPSemtre/cns_vagas_TV/cns_vagas_TV.php"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        print(f"Buscando vagas de: {url}")
        response = requests.get(url, headers=headers, timeout=15)
        
        # O site retorna codificação ISO-8859-1 conforme declarado
        response.encoding = "iso-8859-1"
        
        if response.status_code != 200:
            print(f"Erro na requisição: Código HTTP {response.status_code}")
            return False
            
        soup = BeautifulSoup(response.text, "html.parser")
        
        # A lista de vagas fica contida em um span específico do ScriptCase
        span = soup.find('span', id='id_sc_field_todos_campos_1')
        if not span:
            print("Span 'id_sc_field_todos_campos_1' não foi encontrado na página.")
            return False
            
        # Obter o HTML interno do span
        span_html = span.decode_contents()
        
        # Dividir os blocos usando o separador tracejado
        parts = span_html.split("------------------------------------------------------------------------")
        
        jobs = []
        for idx, part in enumerate(parts):
            if not part.strip():
                continue
            # Garantir que é um bloco de vaga válido (deve conter o título azul)
            if "color=\"#0000EE\"" not in part and "color=#0000EE" not in part:
                continue
                
            sub_soup = BeautifulSoup(part, "html.parser")
            
            # Substituir as tags <br> por nova linha para manter a estrutura original de linhas
            for br in sub_soup.find_all(['br', 'br/']):
                br.replace_with('\n')
                
            text_content = sub_soup.get_text()
            lines = [line.strip() for line in text_content.split('\n') if line.strip()]
            
            # Inicializar campos padrão
            title = "Sem Título"
            deadline = "Não informado"
            experience = "Não informado"
            education = "Não informado"
            salary = "Não informado"
            description = ""
            location_restriction = "Não informado"
            
            # Se tivermos exatamente as 7 linhas esperadas no padrão atual
            if len(lines) == 7:
                title = lines[0]
                
                # Extrair data/hora do prazo
                date_match = re.search(r"(\d{2}/\d{2}/\d{2,4})\s+às\s+(\d{2}:\d{2})", lines[1])
                if date_match:
                    deadline = f"{date_match.group(1)} às {date_match.group(2)}"
                else:
                    deadline = lines[1]
                    
                experience = lines[2]
                education = lines[3]
                
                # Remover prefixo "Salário: "
                if lines[4].lower().startswith("salário:") or lines[4].lower().startswith("salario:"):
                    salary = re.sub(r"^sal[áa]rio:\s*", "", lines[4], flags=re.IGNORECASE).strip()
                else:
                    salary = lines[4]
                    
                description = lines[5]
                
                # Remover prefixo de moradores
                if "somente moradores" in lines[6].lower() or "moradores da(s) cidade(s)" in lines[6].lower():
                    location_restriction = re.sub(r"^somente moradores da\(s\) cidade\(s\):\s*", "", lines[6], flags=re.IGNORECASE).strip()
                else:
                    location_restriction = lines[6]
            else:
                # Fallback robusto baseado em heurísticas caso o layout mude (menos/mais de 7 linhas)
                # Título (Fonte Azul #0000EE)
                title_tag = sub_soup.find('font', color=lambda c: c and c.upper() in ('#0000EE', 'BLUE'))
                if title_tag:
                    title = title_tag.get_text().strip()
                else:
                    if lines:
                        title = lines[0]
                
                # Prazo/Limite (Fonte Roxo #8B008B)
                deadline_tag = sub_soup.find('font', color=lambda c: c and c.upper() in ('#8B008B', 'PURPLE'))
                deadline_text = deadline_tag.get_text().strip() if deadline_tag else ""
                date_match = re.search(r"(\d{2}/\d{2}/\d{2,4})\s+às\s+(\d{2}:\d{2})", deadline_text)
                if date_match:
                    deadline = f"{date_match.group(1)} às {date_match.group(2)}"
                else:
                    deadline = deadline_text
                
                details_list = []
                for line in lines:
                    if line == title or line == deadline_text or line == deadline:
                        continue
                        
                    line_lower = line.lower()
                    
                    if line_lower.startswith("salário:") or line_lower.startswith("salario:"):
                        salary = re.sub(r"^sal[áa]rio:\s*", "", line, flags=re.IGNORECASE).strip()
                        continue
                        
                    if "somente moradores" in line_lower or "moradores da(s) cidade(s)" in line_lower:
                        location_restriction = re.sub(r"^somente moradores da\(s\) cidade\(s\):\s*", "", line, flags=re.IGNORECASE).strip()
                        continue
                        
                    # Checagens estritas para evitar conflito com a descrição
                    if line_lower.startswith("experiência") or line_lower.startswith("experiencia") or line_lower.startswith("sem exigência") or line_lower.startswith("sem exigencia"):
                        experience = line
                        continue
                        
                    if any(line_lower.startswith(edu) for edu in ["ensino", "alfabetizado", "escolaridade", "superior", "médio", "fundamental", "técnico", "tecnico"]):
                        education = line
                        continue
                        
                    details_list.append(line)
                    
                description = " ".join(details_list).strip()
                
            jobs.append({
                "id": len(jobs) + 1,
                "title": title,
                "deadline": deadline,
                "experience": experience,
                "education": education,
                "salary": salary,
                "description": description,
                "location_restriction": location_restriction
            })
            
        # Obter timestamp local atual
        now = datetime.datetime.now()
        timestamp = now.strftime("%d/%m/%Y às %H:%M")
        
        output_data = {
            "last_updated": timestamp,
            "total_jobs": len(jobs),
            "jobs": jobs
        }
        
        # Salvar em JSON no mesmo diretório
        output_path = "vagas.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
            
        print(f"Sucesso! {len(jobs)} vagas salvas em '{output_path}'.")

        # Salvar também em JS para evitar problemas de CORS no carregamento local (file://)
        js_output_path = "vagas.js"
        with open(js_output_path, "w", encoding="utf-8") as f:
            f.write(f"const VAGAS_DATA = {json.dumps(output_data, indent=2, ensure_ascii=False)};\n")
            
        print(f"Sucesso! Vagas salvas também em '{js_output_path}' para evitar bloqueios de CORS.")
        return True
        
    except Exception as e:
        print(f"Ocorreu um erro durante a raspagem: {e}")
        return False

if __name__ == "__main__":
    scrape_job_board()
