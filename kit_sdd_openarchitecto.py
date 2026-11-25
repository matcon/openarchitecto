#!/usr/bin/env python3
import os, re, json, datetime
import pandas as pd

CARPETA = "resultados_sdd"
os.makedirs(CARPETA, exist_ok=True)
SPEC_PATH = "spec_openarchitecto_fullstack.json"
PALABRAS_VAGAS = ["bien", "rapido", "rápido", "adecuado", "eficiente", "optimo", "óptimo", "intuitivo", "facil", "fácil"]


def cumple(val, op, u):
    return val >= u if op == ">=" else (val <= u if op == "<=" else abs(val - u) < 1e-9)


def auditar_ambiguedad(spec):
    avisos = []
    for ca in spec.get("criterios_aceptacion", []):
        desc = str(ca.get("descripcion", "")).lower()
        vagas = [p for p in PALABRAS_VAGAS if re.search(rf"\b{p}\b", desc)]
        if vagas:
            avisos.append(f"{ca['id']}: terminos ambiguos {vagas}")
    return avisos


def ejecutar(mediciones, version="v1"):
    with open(SPEC_PATH, encoding="utf-8") as f:
        spec = json.load(f)
    avisos = auditar_ambiguedad(spec)
    filas = []
    for ca in spec["criterios_aceptacion"]:
        val = mediciones.get(ca["metrica"], float("nan"))
        ok = False if pd.isna(val) else cumple(float(val), ca["operador"], float(ca["umbral"]))
        filas.append({"criterio": ca["id"], "metrica": ca["metrica"], "meta": f"{ca['operador']} {ca['umbral']}", "valor": val, "cumple": "Si" if ok else "No"})
    df = pd.DataFrame(filas)
    df.to_csv(os.path.join(CARPETA, f"eval_{version}.csv"), index=False)
    aprobados = int((df["cumple"] == "Si").sum())
    veredicto = "APROBADO" if (aprobados == len(df) and not avisos) else "RECHAZADO"
    resumen = {"proyecto": spec["proyecto"], "modo": spec["modo"], "version": version, "veredicto": veredicto, "aprobados": aprobados, "total": len(df), "avisos_ambiguedad": avisos, "timestamp_utc": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    with open(os.path.join(CARPETA, "manifiesto_sdd.json"), "w", encoding="utf-8") as f:
        json.dump(resumen, f, ensure_ascii=False, indent=2)
    print(f"SDD {spec['proyecto']} [{version}]: {veredicto} ({aprobados}/{len(df)})")
    return resumen


if __name__ == "__main__":
    with open(SPEC_PATH, encoding="utf-8") as f:
        spec = json.load(f)
    demo = {c["metrica"]: c["umbral"] for c in spec["criterios_aceptacion"]}
    ejecutar(demo, "v1")
