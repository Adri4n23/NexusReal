import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
import os
import sys

# ---------------------------------------------------------
# CONFIGURACIÓN (Prioriza Variables de Entorno para GitHub Actions)
# ---------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://bgqfakzcyejvbddbdape.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_E5tzUn4nyMT3OVDUI0gghA_OfBWmbT_")

# URL Oficial del Banco Central de Venezuela
URL_BCV = "https://www.bcv.org.ve/"

# User-Agent para evitar bloqueos
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
}

def obtener_tasa_bcv():
    """Realiza el scraping de la web oficial del BCV para obtener la tasa del USD."""
    try:
        print(f"[*] Conectando con BCV ({URL_BCV})...")
        response = requests.get(URL_BCV, headers=HEADERS, verify=False, timeout=15) # verify=False por si hay problemas de SSL en el servidor del BCV
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # En el BCV, el valor del USD suele estar en un div con id 'dolar'
        tasa_container = soup.find('div', id='dolar')
        if not tasa_container:
            # Fallback: Buscar por tag y clase si el ID cambió
            tasa_container = soup.select_one(".field-content strong")
            
        if tasa_container:
            tasa_texto = tasa_container.text.strip().replace(',', '.')
            # Limpiar posibles siglas como 'USD' o saltos de línea
            # Ejemplo: 'USD \n 36.50' -> '36.50'
            import re
            valor_limpio = re.search(r'(\d+\.\d+)', tasa_texto)
            if valor_limpio:
                tasa_valor = float(valor_limpio.group(1))
                print(f"[+] Tasa encontrada: {tasa_valor} VES/USD")
                return tasa_valor
            else:
                print(f"[-] No se pudo extraer el valor decimal de: {tasa_texto}")
                return None
        else:
            print("[-] Error: No se pudo localizar el contenedor de la tasa en el HTML.")
            return None

    except Exception as e:
        print(f"[-] Error durante el scraping: {e}")
        return None

def actualizar_supabase(valor):
    """Inserta la tasa en la base de datos de Supabase."""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        data = {
            "valor": valor
        }
        print("[*] Insertando en Supabase...")
        result = supabase.table("historial_tasas").insert(data).execute()
        
        if result:
            print("[✓] Tabla 'historial_tasas' actualizada correctamente.")
        return True
    except Exception as e:
        print(f"[-] Error al conectar/insertar en Supabase: {e}")
        return False

if __name__ == "__main__":
    print("=== NEXUSREAL: BCV TASA MONITOR v1.0 ===")
    tasa = obtener_tasa_bcv()
    
    if tasa:
        exito = actualizar_supabase(tasa)
        if exito:
            print("[!] Proceso finalizado con éxito.")
            sys.exit(0)
    
    print("[!] El proceso falló. Revisa los logs.")
    sys.exit(1)
