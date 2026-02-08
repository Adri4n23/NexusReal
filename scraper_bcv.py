import requests
from bs4 import BeautifulSoup
import json
import time

def obtener_tasa_bcv():
    """
    Scraper oficial para la página del Banco Central de Venezuela.
    """
    url = "https://www.bcv.org.ve/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9",
        "Connection": "keep-alive",
    }

    try:
        print(f"[{time.strftime('%H:%M:%S')}] Conectando al BCV...")
        response = requests.get(url, headers=headers, verify=False, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # El BCV guarda la tasa en un div con id 'dolar'
        # Buscamos el contenedor del dólar
        dolar_container = soup.find('div', id='dolar')
        if not dolar_container:
            return {"error": "No se encontró el contenedor de dólar"}

        # Extraemos el valor (usualmente está en un tag strong)
        tasa_raw = dolar_container.find('strong').text.strip()
        
        # Limpiamos el formato (venezolano usa , para decimales)
        tasa_limpia = tasa_raw.replace('.', '').replace(',', '.')
        tasa_float = float(tasa_limpia)

        return {
            "moneda": "USD",
            "tasa": tasa_float,
            "fecha": time.strftime('%Y-%m-%d %H:%M:%S'),
            "fuente": "BCV Oficial"
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    resultado = obtener_tasa_bcv()
    print(json.dumps(resultado, indent=4, ensure_ascii=False))
