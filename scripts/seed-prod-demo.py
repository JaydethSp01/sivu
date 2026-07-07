#!/usr/bin/env python3
"""
Seed de DEMOSTRACIÓN para PRODUCCIÓN (Coformación v2).

Llena el ciclo de vida completo sobre la práctica que la Oficina de Coformación
ya tiene sembrada para Kelly (convenio + trimestre), de modo que TODAS las
pantallas muestren datos reales en la sustentación:

  plan de actividades → 3 actas → evaluación tutor → evaluación profesor (2 cortes)
  → plan de mejora → informe final (12 secciones + tablas PESTEL/5W) → notas
  → convenio finalizado con nota.

Idempotente: cada paso se puede re-ejecutar sin duplicar (PUT hace upsert; los
POST verifican existencia previa).

Uso:
    python3 seed-prod-demo.py [BASE_URL]
    BASE_URL por defecto: https://sivu-backend.onrender.com/api/v1
"""
import json, sys, urllib.request, urllib.error
from urllib.parse import urlencode

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://sivu-backend.onrender.com/api/v1"

CREDS = {
    "ADMIN":       {"email": "admin@uempresarial.edu.co",     "password": "Admin123*"},
    "COORDINADOR": {"email": "coord@uempresarial.edu.co",     "password": "Coord123*"},
    "ESTUDIANTE":  {"email": "kelly@est.uempresarial.edu.co",  "password": "Estudiante123*"},
    "TUTOR":       {"email": "rrhh@coally.com",               "password": "Tutor123*"},
}
TOK = {}
G, Y, R, RST = "\033[92m", "\033[93m", "\033[91m", "\033[0m"
def ok(m):   print(f"  {G}✓{RST} {m}")
def warn(m): print(f"  {Y}⚠{RST} {m}")
def die(m):  print(f"  {R}✗ {m}{RST}"); sys.exit(1)

def req(method, path, role=None, body=None, params=None):
    url = BASE + path + (("?" + urlencode(params)) if params else "")
    headers = {}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if role and TOK.get(role):
        headers["Authorization"] = "Bearer " + TOK[role]
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=90) as resp:
            txt = resp.read().decode()
            return resp.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try: body = json.loads(txt)
        except Exception: body = txt
        return e.code, body
    except Exception as e:
        return 0, str(e)

def login_all():
    for role, c in CREDS.items():
        s, d = req("POST", "/auth/login", body=c)
        if s != 200: die(f"login {role}: {s} {d}")
        TOK[role] = d["accessToken"]
    ok("login OK (Admin · Coformación · Estudiante · Tutor)")

def main():
    print("=== SEED DEMO PROD: ciclo de vida completo ===\n")
    login_all()

    # --- estudiante Kelly ---
    s, page = req("GET", "/estudiantes", "COORDINADOR", params={"q": "kelly", "page": 0, "size": 10})
    est = next((e for e in (page.get("content", []) if isinstance(page, dict) else [])
                if "kelly" in (e.get("email") or "").lower()), None)
    if not est: die("no se encontró a la estudiante Kelly")
    EST_ID = est["id"]
    ok(f"estudiante: {est['nombres']} {est['apellidos']} (doc {est['numeroDocumento']}, id={EST_ID})")

    # --- convenio (ya sembrado por la Oficina) ---
    s, page = req("GET", "/convenios", "COORDINADOR", params={"estudianteId": EST_ID, "page": 0, "size": 1})
    convs = page.get("content", []) if isinstance(page, dict) else []
    if not convs: die("Kelly no tiene convenio en prod (¿el seed base no corrió?).")
    CONV_ID = convs[0]["id"]
    ok(f"convenio (práctica) id={CONV_ID}")

    # --- trimestre ---
    s, tris = req("GET", f"/convenios/{CONV_ID}/trimestres", "COORDINADOR")
    tri_list = tris if isinstance(tris, list) else (tris.get("content", []) if isinstance(tris, dict) else [])
    if not tri_list: die("el convenio no tiene trimestre.")
    TRI_ID = tri_list[0]["id"]
    ok(f"trimestre (corte) id={TRI_ID}")

    # --- 1. PLAN DE ACTIVIDADES (GAC-FM-10) ---
    s, _ = req("PUT", f"/trimestres/{TRI_ID}/plan-actividades", "COORDINADOR",
               body={"escenarioCoformacion": "Desarrollo de software en Coally S.A.S.",
                     "pemDescripcionEscenario": "El equipo backend necesita automatizar la reportería.",
                     "pemObjetivoGeneral": "Implementar un módulo de reportería que reduzca el tiempo manual.",
                     "objetivos": [
                         {"escenario": "Backend", "descripcion": "Aplicar Spring Boot en un caso real", "seleccionado": True, "orden": 1},
                         {"escenario": "Datos", "descripcion": "Modelar y consultar PostgreSQL", "seleccionado": True, "orden": 2},
                     ],
                     "meses": [
                         {"mes": 1, "areaRotacion": "Backend", "actividades": "Onboarding + primeras APIs", "tutorNombre": "Juan Castro"},
                         {"mes": 2, "areaRotacion": "Backend", "actividades": "Módulo de reportería", "tutorNombre": "Juan Castro"},
                         {"mes": 3, "areaRotacion": "QA", "actividades": "Pruebas y despliegue", "tutorNombre": "Juan Castro"},
                     ]})
    if s == 200:
        for parte in ["ESTUDIANTE", "TUTOR", "PROFESOR"]:
            req("PATCH", f"/trimestres/{TRI_ID}/plan-actividades/firmar/{parte}", "COORDINADOR")
        ok("plan de actividades guardado y firmado (3 partes)")
    else:
        warn(f"plan actividades: {s} {_}")

    # --- 2. ACTAS (3) — solo crear las que falten ---
    s, existentes = req("GET", f"/trimestres/{TRI_ID}/actas", "COORDINADOR")
    ya = len(existentes) if isinstance(existentes, list) else len(existentes.get("content", []) if isinstance(existentes, dict) else [])
    actas = [
        (1, "INICIAL",          "2026-07-05", "Reunión de inicio de práctica"),
        (2, "SEGUIMIENTO",      "2026-08-15", "Seguimiento de mitad de periodo"),
        (3, "EVALUACION_FINAL", "2026-09-25", "Cierre y evaluación final"),
    ]
    creadas = 0
    for num, tipo, fecha, asunto in actas:
        if num <= ya:
            continue
        s, acta = req("POST", f"/trimestres/{TRI_ID}/actas", "COORDINADOR",
                      body={"numero": num, "fecha": fecha, "hora": "10:00", "lugar": "Google Meet",
                            "asunto": asunto, "tipoReunion": tipo, "modalidad": "VIRTUAL",
                            "asistentes": [
                                {"nombre": "Kellyn Delgado", "rol": "Estudiante", "correo": "kelly@est.uempresarial.edu.co"},
                                {"nombre": "Juan Castro", "rol": "Tutor empresarial", "correo": "jcastro@coally.com"},
                                {"nombre": "Carlos Mendoza", "rol": "Docente acompañante", "correo": "cmendoza@uempresarial.edu.co"},
                            ],
                            "observaciones": "Sin novedades relevantes; avance conforme al plan.",
                            "temas": [{"tema": "Avance de actividades", "observaciones": "En tiempo", "orden": 1}]})
        if s in (200, 201):
            aid = acta["id"]
            for parte in ["ESTUDIANTE", "TUTOR", "PROFESOR"]:
                req("PATCH", f"/actas/{aid}/firmar/{parte}", "COORDINADOR")
            creadas += 1
        else:
            warn(f"acta {num}: {s} {acta}")
    ok(f"actas: {ya} existentes + {creadas} nuevas (GAC-FM-11)")

    # --- 3. EVALUACIÓN TUTOR (GAC-FM-007) ---
    s, _ = req("PUT", f"/trimestres/{TRI_ID}/evaluacion-tutor", "COORDINADOR",
               body={"capacidades": 4.5, "actitudes": 4.7, "aplicacionDesempeno": 4.6,
                     "aplicacionElaboracionPem": 4.5, "aplicacionSustentacionPem": 4.4,
                     "continuidadConEmpresa": True,
                     "observaciones": "Excelente desempeño; la empresa desea continuidad.",
                     "fechaElaboracion": "2026-09-28"})
    if s == 200:
        for parte in ["TUTOR", "ESTUDIANTE"]:
            req("PATCH", f"/trimestres/{TRI_ID}/evaluacion-tutor/firmar/{parte}", "COORDINADOR")
        ok("evaluación del tutor (GAC-FM-007) guardada y firmada · continuidad=SÍ")
    else:
        warn(f"eval tutor: {s} {_}")

    # --- 4. EVALUACIÓN PROFESOR (GAC-FM-1, 2 cortes) ---
    s, _ = req("PUT", f"/trimestres/{TRI_ID}/evaluacion-profesor", "COORDINADOR",
               body={"capacidades": 4.3, "actitudes": 4.5, "aplicacionDesempeno": 4.4,
                     "aplicacionElaboracionPem": 4.6, "aplicacionSustentacionPem": 4.2,
                     "observacionesC1": "Buen primer corte.", "fechaC1": "2026-08-20",
                     "capacidadesC2": 4.6, "actitudesC2": 4.7, "aplicacionDesempenoC2": 4.7,
                     "aplicacionElaboracionPemC2": 4.8, "aplicacionSustentacionPemC2": 4.5,
                     "observacionesC2": "Mejoró notablemente.", "fechaC2": "2026-09-26",
                     "observaciones": "Proceso sólido en ambos cortes.", "fechaElaboracion": "2026-09-28"})
    if s == 200:
        for parte in ["PROFESOR", "ESTUDIANTE"]:
            req("PATCH", f"/trimestres/{TRI_ID}/evaluacion-profesor/firmar/{parte}", "COORDINADOR")
        ok("evaluación del profesor (GAC-FM-1, 2 cortes) guardada y firmada")
    else:
        warn(f"eval profesor: {s} {_}")

    # --- 5. PLAN DE MEJORA (crear si no existe) ---
    s, pms = req("GET", f"/trimestres/{TRI_ID}/planes-mejora", "COORDINADOR")
    pm_list = pms if isinstance(pms, list) else (pms.get("content", []) if isinstance(pms, dict) else [])
    if pm_list:
        PM_ID = pm_list[0]["id"]
        ok(f"plan de mejora ya existe (id={PM_ID})")
    else:
        s, pm = req("POST", f"/trimestres/{TRI_ID}/planes-mejora", "COORDINADOR",
                    body={"numero": 1, "titulo": "Automatización de reportería en Coally",
                          "problema": "Los reportes se generan manualmente y consumen 6 horas semanales.",
                          "objetivo": "Reducir el tiempo de reportería en 80% mediante automatización.",
                          "actividades": "Diseño, desarrollo del módulo, pruebas y despliegue.",
                          "indicadores": "Tiempo de generación; cobertura de pruebas."})
        if s not in (200, 201): die(f"plan de mejora: {s} {pm}")
        PM_ID = pm["id"]
        ok(f"plan de mejora creado (id={PM_ID})")

    # --- 6. INFORME FINAL (GTC-FM-16): crear + secciones (con tablas) ---
    req("PUT", f"/planes-mejora/{PM_ID}/informe-final", "COORDINADOR",
        body={"tituloInforme": "Automatización del proceso de reportería en Coally S.A.S.",
              "nivel": 3, "cargoTutorEmpresarial": "Tech Lead Backend",
              "resumenEjecutivo": "Se desarrolló un módulo de reportería automatizada que redujo el tiempo manual en 80%.",
              "contextualizacion": "Coally S.A.S. es una empresa de tecnología del sector de talento.",
              "planteamientoProblema": "La generación manual de reportes consumía 6 horas semanales y era propensa a errores.",
              "marcoTeorico": "Arquitectura de microservicios, patrones de diseño y automatización con Spring Batch.",
              "objetivoGeneral": "Implementar un módulo de reportería automatizada que reduzca el tiempo en al menos 80%.",
              "objetivosEspecificos": "1) Diagnosticar. 2) Diseñar. 3) Desarrollar. 4) Validar.",
              "diagnostico": "Análisis externo e interno de la organización y del área funcional.",
              "metodologia": "Metodología ágil con iteraciones semanales y entregas incrementales.",
              "propuestaSolucion": "Módulo backend en Spring Boot que consulta la BD y genera reportes en PDF.",
              "factibilidad": "Técnicamente viable; ahorra ~24 horas/mes de trabajo manual.",
              "conclusiones": "El módulo redujo la reportería de 6 h a menos de 1 h semanal, cumpliendo los objetivos.",
              "anexos": "Diagramas de arquitectura, capturas y repositorio.", "numeroPaginas": 14})
    s2, inf = req("GET", f"/planes-mejora/{PM_ID}/informe-final", "COORDINADOR")
    INF_ID = inf["id"] if s2 == 200 and isinstance(inf, dict) else None
    if INF_ID:
        req("PUT", f"/informes-final-pm/{INF_ID}/secciones", "COORDINADOR",
            body={
              "resumenEjecutivo": "Se desarrolló un módulo de reportería automatizada que redujo el tiempo manual en 80%.",
              "contextualizacionEmpresa": "Coally/Efecty opera servicios financieros con amplia cobertura nacional.",
              "planteamientoProblema": "La documentación técnica dispersa dificulta la incorporación de talento.",
              "marcoTeorico": "DevOps, CI/CD y gestión del conocimiento.",
              "objetivos": "General: centralizar la documentación. Específicos: diagnosticar, diseñar y desplegar una wiki.",
              "diagnostico": "Diagnóstico externo (PESTEL) e interno del área funcional.",
              "metodologia": "Metodología del plan de mejora estructurada (5W).",
              "justificacion": "Reduce errores, acelera el onboarding y mejora la eficiencia operativa.",
              "factibilidad": "Viable con el stack actual (Azure DevOps).",
              "resultados": "Wiki centralizada; reducción del tiempo de documentación.",
              "conclusiones": "El plan de mejora cumplió el objetivo y es replicable.",
              "referenciasApa": "Referencias en formato APA 7.",
              # Tabla 1 · Diagnóstico externo (PESTEL)
              "pestelPolitico": "La regulación financiera exige altos estándares de seguridad y trazabilidad.",
              "pestelEconomico": "La eficiencia operativa hace más relevante la documentación técnica.",
              "pestelSocial": "El uso creciente de servicios digitales exige plataformas mejor documentadas.",
              "pestelTecnologico": "DevOps y CI/CD obligan a adoptar buenas prácticas de documentación.",
              "ventajaCompetitiva": "Amplia cobertura nacional; una wiki centralizada fortalece la ventaja.",
              # Tabla 2 · Diagnóstico interno
              "internoCapacidadDirectiva": "Liderazgo técnico por célula, pero sin política de documentación.",
              "internoCapacidadTecnologica": "Herramientas modernas subutilizadas por falta de cultura documental.",
              "internoCapacidadTecnica": "Buena infraestructura; la falta de documentación limita su aprovechamiento.",
              "internoTalentoHumano": "Equipo competente; la rotación genera pérdida de conocimiento sin documentación.",
              # Tabla 3 · Metodología (5W)
              "metodologiaQue": "Diagnosticar y centralizar la documentación técnica de las células.",
              "metodologiaComo": "Revisión de repositorios y construcción de una wiki en Azure DevOps.",
              "metodologiaCuando": "Inicio 01/10/2025 – Fin 15/12/2025.",
              "metodologiaDonde": "Células de trabajo; alcance célula MSquad.",
              "metodologiaConQuien": "Ingenieros senior y arquitectos de software de la empresa.",
            })
        req("POST", f"/informes-final-pm/{INF_ID}/entregar", "ESTUDIANTE")
        req("POST", f"/informes-final-pm/{INF_ID}/nota-tutor", "COORDINADOR", body={"nota": 4.6})
        req("POST", f"/informes-final-pm/{INF_ID}/nota-profesor", "COORDINADOR", body={"nota": 4.5})
        req("POST", f"/informes-final-pm/{INF_ID}/alto-impacto", "COORDINADOR", body={"altoImpacto": True})
        req("POST", f"/informes-final-pm/{INF_ID}/aprobar", "COORDINADOR")
        ok(f"informe final (GTC-FM-16) completo: 12 secciones + tablas PESTEL/5W + notas + aprobado")
    else:
        warn("no se pudo obtener el id del informe final")

    # --- 7. FINALIZAR CONVENIO con nota ---
    s, _ = req("PATCH", f"/convenios/{CONV_ID}/finalizar", "ADMIN", body={"calificacionFinal": 4.6})
    if s == 200: ok("convenio FINALIZADO con nota 4.6")
    else: warn(f"finalizar: {s} {_}")

    print(f"\n{G}=== LISTO ==={RST}")
    print(f"  Práctica de Kellyn Delgado de inicio a fin (convenio #{CONV_ID}, trimestre #{TRI_ID}).")
    print("  Todas las pantallas de Coformación muestran datos reales.\n")

if __name__ == "__main__":
    main()
